'use strict';

const crypto = require('node:crypto');
const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const workflowDomain = require('../governance/operatingWorkflow');
const router = express.Router();

function problem(status, message) { const error = new Error(message); error.status = status; return error; }
function asyncRoute(handler) { return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next); }
function text(value, name, min = 1, max = 500) { if (typeof value !== 'string' || value.trim().length < min || value.length > max) throw problem(400, `${name} is invalid`); return value.trim(); }
function requireRole(...roles) { return (req, _res, next) => roles.includes(req.user.role) || req.user.role === 'admin' ? next() : next(problem(403, 'role is not permitted')); }
async function event(client, identity, item, type, toStatus, reason, details = {}) {
  await client.query(
    `INSERT INTO company_workflow_events(tenant_id,workflow_id,event_type,from_status,to_status,actor_id,actor_role,reason,details)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [item.tenant_id, item.id, type, item.status, toStatus || item.status, String(identity.id), identity.role, reason || null, details]
  );
}

router.post('/webhooks/:connector', asyncRoute(async (req, res) => {
  const connector = req.params.connector;
  if (!workflowDomain.operationSpecs[connector]) throw problem(404, 'unknown connector');
  const secrets = JSON.parse(process.env.CONNECTOR_WEBHOOK_SECRETS_JSON || '{}');
  const eventId = text(req.get('x-provider-event-id'), 'provider event ID', 4, 200);
  if (!workflowDomain.verify(secrets[connector], req.body, req.get('x-provider-signature'))) throw problem(401, 'invalid callback signature');
  const idempotencyKey = text(req.body?.idempotencyKey, 'idempotencyKey', 8, 200);
  if (!['succeeded','failed'].includes(req.body?.outcome)) throw problem(400, 'invalid connector outcome');
  const payloadDigest = workflowDomain.digest(req.body);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const inserted = await client.query(
      `INSERT INTO company_connector_events(connector,event_id,idempotency_key,payload_digest,outcome,provider_receipt)
       VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING event_id`,
      [connector, eventId, idempotencyKey, payloadDigest, req.body.outcome, req.body.receiptId || null]
    );
    if (!inserted.rowCount) {
      const old = await client.query('SELECT payload_digest FROM company_connector_events WHERE connector=$1 AND event_id=$2', [connector, eventId]);
      await client.query('ROLLBACK');
      if (old.rows[0]?.payload_digest !== payloadDigest) throw problem(409, 'provider event ID conflict');
      return res.json({ duplicate: true });
    }
    const work = await client.query('SELECT * FROM company_connector_outbox WHERE connector=$1 AND idempotency_key=$2 FOR UPDATE', [connector, idempotencyKey]);
    if (!work.rowCount) throw problem(404, 'connector work item not found');
    const itemResult = await client.query('SELECT * FROM governed_workflows WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [work.rows[0].workflow_id, work.rows[0].tenant_id]);
    if (!itemResult.rowCount) throw problem(404, 'workflow not found');
    const item = itemResult.rows[0];
    if (item.status !== 'dispatch_pending') throw problem(409, 'workflow is not awaiting connector delivery');
    const evaluation = workflowDomain.evaluateResult({ acceptanceCriteria: item.acceptance_criteria }, req.body);
    if (req.body.outcome === 'failed') {
      const policy = workflowDomain.retry(Math.max(0, work.rows[0].attempts - 1), Boolean(req.body.retryable));
      await client.query(
        `UPDATE company_connector_outbox SET status=$1,attempts=$2,available_at=NOW()+($3*interval '1 second'),lease_until=NULL,last_error=$4,updated_at=NOW() WHERE id=$5`,
        [policy.status, policy.attempts, policy.delaySeconds || 0, text(req.body.errorCode || 'connector_failed', 'errorCode', 2, 200), work.rows[0].id]
      );
      if (policy.status === 'dead_letter') {
        await client.query("UPDATE governed_workflows SET status='delivery_failed',version=version+1,last_error=$1,updated_at=NOW() WHERE id=$2", [req.body.errorCode || 'connector_failed', item.id]);
        await event(client, { id: `connector:${connector}`, role: 'connector' }, item, 'delivery_failed', 'delivery_failed', req.body.errorCode, { eventId, retryable: Boolean(req.body.retryable) });
      } else await event(client, { id: `connector:${connector}`, role: 'connector' }, item, 'delivery_retry_scheduled', item.status, req.body.errorCode, { eventId, delaySeconds: policy.delaySeconds });
    } else if (!evaluation.accepted) {
      await client.query("UPDATE company_connector_outbox SET status='succeeded',provider_receipt=$1,lease_until=NULL,updated_at=NOW() WHERE id=$2", [req.body.receiptId, work.rows[0].id]);
      await client.query("UPDATE governed_workflows SET status='delivery_failed',version=version+1,provider_receipt=$1,result=$2,acceptance_evidence=$3,last_error=$4,updated_at=NOW() WHERE id=$5", [req.body.receiptId, req.body.result, req.body.evidence || {}, evaluation.reason, item.id]);
      await event(client, { id: `connector:${connector}`, role: 'connector' }, item, 'acceptance_failed', 'delivery_failed', evaluation.reason, { eventId, missing: evaluation.missing || [] });
    } else {
      await client.query("UPDATE company_connector_outbox SET status='succeeded',provider_receipt=$1,lease_until=NULL,updated_at=NOW() WHERE id=$2", [req.body.receiptId, work.rows[0].id]);
      await client.query("UPDATE governed_workflows SET status='completed',version=version+1,provider_receipt=$1,result=$2,acceptance_evidence=$3,last_error=NULL,updated_at=NOW() WHERE id=$4", [req.body.receiptId, evaluation.result, evaluation.evidence, item.id]);
      await event(client, { id: `connector:${connector}`, role: 'connector' }, item, 'completed', 'completed', null, { eventId, receiptId: req.body.receiptId });
    }
    await client.query('UPDATE company_connector_events SET processed_at=NOW() WHERE connector=$1 AND event_id=$2', [connector, eventId]);
    await client.query('COMMIT');
    res.status(202).json({ accepted: true, evaluation });
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));

router.use(auth);

router.post('/', requireRole('requester'), asyncRoute(async (req, res) => {
  const key = text(req.get('idempotency-key'), 'Idempotency-Key', 8, 200);
  const input = workflowDomain.validateIntake(req.body, req.user.id);
  const requestDigest = workflowDomain.digest(input);
  const id = crypto.randomUUID();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const inserted = await client.query(
      `INSERT INTO governed_workflows(id,tenant_id,title,connector,operation,owner_id,acceptance_criteria,payload,idempotency_key,request_digest)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(tenant_id,idempotency_key) DO NOTHING RETURNING *`,
      [id, req.user.tenantId, input.title, input.connector, input.operation, input.ownerId, JSON.stringify(input.acceptanceCriteria), input.payload, key, requestDigest]
    );
    if (!inserted.rowCount) {
      const old = await client.query('SELECT * FROM governed_workflows WHERE tenant_id=$1 AND idempotency_key=$2', [req.user.tenantId, key]);
      await client.query('ROLLBACK');
      if (old.rows[0]?.request_digest !== requestDigest) throw problem(409, 'idempotency conflict');
      return res.json(old.rows[0]);
    }
    await event(client, req.user, inserted.rows[0], 'created', 'intake', null, { requestDigest });
    await client.query('COMMIT');
    res.status(201).json(inserted.rows[0]);
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));

router.get('/', asyncRoute(async (req, res) => {
  const owner = req.user.role === 'requester' ? ' AND owner_id=$2' : '';
  const result = await db.query(`SELECT * FROM governed_workflows WHERE tenant_id=$1${owner} ORDER BY updated_at DESC LIMIT 200`, req.user.role === 'requester' ? [req.user.tenantId, String(req.user.id)] : [req.user.tenantId]);
  res.json(result.rows);
}));

router.get('/metrics', requireRole('operator', 'reviewer'), asyncRoute(async (req, res) => {
  const result = await db.query(
    `SELECT COALESCE(EXTRACT(EPOCH FROM NOW()-(MIN(created_at) FILTER(WHERE status IN('pending','retry')))),0)::integer AS oldest_pending_seconds,
      COALESCE(AVG(CASE WHEN status='dead_letter' THEN 1 ELSE 0 END),0)::float AS error_rate,
      COUNT(*) FILTER(WHERE status='dead_letter')::integer AS dead_letters FROM company_connector_outbox WHERE tenant_id=$1`,
    [req.user.tenantId]
  );
  const metrics = { oldestPendingSeconds: result.rows[0].oldest_pending_seconds, errorRate: result.rows[0].error_rate, deadLetters: result.rows[0].dead_letters };
  res.json({ metrics, ...workflowDomain.health(metrics) });
}));

router.get('/:id', asyncRoute(async (req, res) => {
  const owner = req.user.role === 'requester' ? ' AND owner_id=$3' : '';
  const result = await db.query(
    `SELECT w.*,
      COALESCE((SELECT jsonb_agg(e ORDER BY occurred_at) FROM company_workflow_events e WHERE e.workflow_id=w.id),'[]') events,
      COALESCE((SELECT jsonb_agg(o ORDER BY created_at) FROM company_connector_outbox o WHERE o.workflow_id=w.id),'[]') connector_work
     FROM governed_workflows w WHERE w.id=$1 AND w.tenant_id=$2${owner}`,
    req.user.role === 'requester' ? [req.params.id, req.user.tenantId, String(req.user.id)] : [req.params.id, req.user.tenantId]
  );
  if (!result.rowCount) throw problem(404, 'workflow not found');
  res.json(result.rows[0]);
}));

router.post('/:id/transitions', asyncRoute(async (req, res) => {
  if (!Number.isInteger(req.body?.expectedVersion) || req.body.expectedVersion < 1) throw problem(400, 'expectedVersion must be a positive integer');
  const toStatus = text(req.body.toStatus, 'toStatus', 2, 40);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query('SELECT * FROM governed_workflows WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [req.params.id, req.user.tenantId]);
    if (!found.rowCount) throw problem(404, 'workflow not found');
    const item = found.rows[0];
    if (item.version !== req.body.expectedVersion) throw problem(409, `version conflict; current version is ${item.version}`);
    workflowDomain.transition(item.status, toStatus, req.user.role, req.user.id, item.owner_id);
    const updated = await client.query('UPDATE governed_workflows SET status=$1,version=version+1,updated_at=NOW() WHERE id=$2 RETURNING *', [toStatus, item.id]);
    await event(client, req.user, item, 'transition', toStatus, req.body.reason, {});
    if (toStatus === 'dispatch_pending') {
      const job = workflowDomain.connectorJob({ ...updated.rows[0], tenantId: updated.rows[0].tenant_id });
      await client.query(
        `INSERT INTO company_connector_outbox(tenant_id,workflow_id,connector,operation,idempotency_key,payload_digest,payload)
         VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(connector,idempotency_key) DO NOTHING`,
        [req.user.tenantId, item.id, job.connector, job.operation, job.idempotencyKey, job.payloadDigest, job.payload]
      );
    }
    await client.query('COMMIT');
    res.json(updated.rows[0]);
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}));

router.post('/connectors/:connector/claim', requireRole('operator'), asyncRoute(async (req, res) => {
  const connector = req.params.connector;
  if (!workflowDomain.operationSpecs[connector]) throw problem(404, 'unknown connector');
  const result = await db.query(
    `WITH candidate AS (SELECT id FROM company_connector_outbox WHERE connector=$1 AND tenant_id=$2 AND
      ((status IN('pending','retry') AND available_at<=NOW()) OR (status='leased' AND lease_until<NOW()))
      ORDER BY available_at,id FOR UPDATE SKIP LOCKED LIMIT 1)
     UPDATE company_connector_outbox o SET status='leased',attempts=attempts+1,lease_until=NOW()+interval '2 minutes',updated_at=NOW()
     FROM candidate WHERE o.id=candidate.id RETURNING o.*`,
    [connector, req.user.tenantId]
  );
  if (!result.rowCount) return res.status(204).send();
  res.json(result.rows[0]);
}));

router.use((error, _req, res, _next) => {
  const status = Number(error.status) || (/invalid|required|unsupported|forbidden|unexpected|exceeds|cannot approve/i.test(error.message) ? 422 : 500);
  if (status >= 500) console.error(error);
  res.status(status).json({ error: status >= 500 ? 'internal server error' : error.message });
});

module.exports = router;
