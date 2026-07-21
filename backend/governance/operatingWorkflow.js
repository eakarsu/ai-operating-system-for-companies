'use strict';

const crypto = require('node:crypto');

const states = Object.freeze({
  intake: ['validated', 'rejected', 'cancelled'],
  validated: ['approval_pending', 'cancelled'],
  approval_pending: ['approved', 'rejected'],
  approved: ['dispatch_pending', 'cancelled'],
  dispatch_pending: [],
  delivery_failed: ['dispatch_pending', 'cancelled'],
  completed: [], rejected: [], cancelled: []
});
const roles = Object.freeze({
  requester: ['intake:validated', 'intake:cancelled', 'validated:cancelled'],
  reviewer: ['validated:approval_pending', 'approval_pending:approved', 'approval_pending:rejected'],
  operator: ['approved:dispatch_pending', 'delivery_failed:dispatch_pending', 'delivery_failed:cancelled'],
  admin: ['*']
});

const operationSpecs = Object.freeze({
  crm: {
    upsert_account: { required: { accountRef: 'string', name: 'string' }, optional: { ownerRef: 'string' } },
    create_opportunity: { required: { accountRef: 'string', amountCents: 'integer', currency: 'currency' }, optional: { stage: 'string' } }
  },
  accounting: { post_invoice: { required: { invoiceRef: 'string', totalCents: 'integer', currency: 'currency' }, optional: { accountRef: 'string' } } },
  ticketing: { create_ticket: { required: { summary: 'string', priority: 'priority' }, optional: { accountRef: 'string', description: 'string' } } },
  calendar: { create_event: { required: { startsAt: 'datetime', endsAt: 'datetime', attendeeRefs: 'string_array' }, optional: { title: 'string' } } },
  messaging: { send_notification: { required: { recipientRef: 'string', templateKey: 'string', variables: 'object' }, optional: {} } },
  data_warehouse: { load_record: { required: { dataset: 'identifier', record: 'object' }, optional: {} } }
});

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).filter((key) => value[key] !== undefined).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
const digest = (value) => crypto.createHash('sha256').update(canonical(value)).digest('hex');

function valueMatches(value, type) {
  if (type === 'string') return typeof value === 'string' && value.trim().length >= 1 && value.length <= 1000;
  if (type === 'integer') return Number.isSafeInteger(value) && value >= 0;
  if (type === 'currency') return typeof value === 'string' && /^[A-Z]{3}$/.test(value);
  if (type === 'priority') return ['low', 'normal', 'high', 'urgent'].includes(value);
  if (type === 'datetime') return typeof value === 'string' && Number.isFinite(Date.parse(value));
  if (type === 'string_array') return Array.isArray(value) && value.length <= 100 && value.every((item) => typeof item === 'string' && item.length >= 1 && item.length <= 200);
  if (type === 'object') return value && typeof value === 'object' && !Array.isArray(value);
  if (type === 'identifier') return typeof value === 'string' && /^[a-zA-Z0-9_-]{2,100}$/.test(value);
  return false;
}

function validatePayload(connector, operation, payload) {
  const spec = operationSpecs[connector]?.[operation];
  if (!spec) throw new Error('unsupported connector operation');
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('payload must be an object');
  if (canonical(payload).length > 65_536) throw new Error('payload exceeds 64 KiB');
  const allowed = new Set([...Object.keys(spec.required), ...Object.keys(spec.optional)]);
  for (const key of Object.keys(payload)) if (!allowed.has(key)) throw new Error(`unexpected payload field: ${key}`);
  for (const [key, type] of Object.entries(spec.required)) if (!valueMatches(payload[key], type)) throw new Error(`invalid payload field: ${key}`);
  for (const [key, type] of Object.entries(spec.optional)) if (payload[key] !== undefined && !valueMatches(payload[key], type)) throw new Error(`invalid payload field: ${key}`);
  if (connector === 'calendar' && Date.parse(payload.endsAt) <= Date.parse(payload.startsAt)) throw new Error('calendar event end must follow start');
  if (/password|secret|api.?key|access.?token/i.test(canonical(payload))) throw new Error('secrets are forbidden in workflow payloads');
  return payload;
}

function validateIntake(input, actorId) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('intake must be an object');
  if (typeof input.title !== 'string' || input.title.trim().length < 3 || input.title.length > 200) throw new Error('title required');
  if (!operationSpecs[input.connector]) throw new Error('unsupported connector');
  const criteria = input.acceptanceCriteria;
  if (!Array.isArray(criteria) || !criteria.length || criteria.length > 20) throw new Error('acceptance criteria required');
  const acceptanceCriteria = criteria.map((criterion) => {
    if (typeof criterion !== 'string' || criterion.trim().length < 3 || criterion.length > 300) throw new Error('invalid acceptance criterion');
    return criterion.trim();
  });
  if (new Set(acceptanceCriteria).size !== acceptanceCriteria.length) throw new Error('acceptance criteria must be unique');
  return {
    title: input.title.trim(), connector: input.connector, operation: input.operation,
    ownerId: String(actorId), acceptanceCriteria, payload: validatePayload(input.connector, input.operation, input.payload || {})
  };
}

function transition(from, to, role, actorId, ownerId) {
  if (!states[from]?.includes(to)) throw new Error(`invalid transition ${from} -> ${to}`);
  const grants = roles[role] || [];
  if (!grants.includes('*') && !grants.includes(`${from}:${to}`)) throw new Error('role cannot perform transition');
  if (to === 'approved' && String(actorId) === String(ownerId)) throw new Error('request owner cannot approve own work');
  return true;
}

function connectorJob(workflow) {
  validatePayload(workflow.connector, workflow.operation, workflow.payload);
  const payload = { workflowId: workflow.id, tenantId: workflow.tenantId, operation: workflow.operation, input: workflow.payload };
  return { connector: workflow.connector, operation: workflow.operation, idempotencyKey: `workflow:${workflow.id}:v${workflow.version}`, payload, payloadDigest: digest(payload), status: 'pending', attempts: 0 };
}

function evaluateResult(workflow, callback) {
  if (!callback || !['succeeded', 'failed'].includes(callback.outcome)) throw new Error('invalid connector outcome');
  if (callback.outcome === 'failed') return { accepted: false, reason: 'connector_failed' };
  if (typeof callback.receiptId !== 'string' || callback.receiptId.length < 4 || callback.receiptId.length > 500) throw new Error('valid receiptId required');
  if (!callback.result || typeof callback.result !== 'object' || Array.isArray(callback.result)) throw new Error('connector result must be an object');
  const evidence = callback.evidence;
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) throw new Error('acceptance evidence required');
  const missing = workflow.acceptanceCriteria.filter((criterion) => evidence[criterion] !== true);
  if (missing.length) return { accepted: false, reason: 'acceptance_criteria_failed', missing };
  return { accepted: true, result: callback.result, evidence };
}

function retry(attempts, retryable, max = 5) {
  if (!Number.isInteger(attempts) || attempts < 0 || !Number.isInteger(max) || max < 1 || max > 10) throw new Error('invalid retry policy');
  const next = attempts + 1;
  return !retryable || next >= max ? { status: 'dead_letter', attempts: next } : { status: 'retry', attempts: next, delaySeconds: Math.min(900, 2 ** next * 5) };
}
function sign(secret, event) { if (typeof secret !== 'string' || secret.length < 32) throw new Error('webhook secret must be at least 32 characters'); return crypto.createHmac('sha256', secret).update(canonical(event)).digest('hex'); }
function verify(secret, event, signature) { if (typeof secret !== 'string' || secret.length < 32 || !/^[a-f0-9]{64}$/.test(String(signature))) return false; const a = Buffer.from(sign(secret, event), 'hex'); const b = Buffer.from(String(signature), 'hex'); return a.length === b.length && crypto.timingSafeEqual(a, b); }
function health(metrics) { const alerts = []; if (metrics.oldestPendingSeconds > 300) alerts.push('queue_lag'); if (metrics.errorRate > 0.05) alerts.push('connector_error_rate'); if (metrics.deadLetters > 0) alerts.push('dead_letters'); return { healthy: alerts.length === 0, alerts }; }

module.exports = { states, roles, operationSpecs, canonical, digest, validatePayload, validateIntake, transition, connectorJob, evaluateResult, retry, sign, verify, health };
