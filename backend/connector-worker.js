'use strict';
require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });
const db = require('./db');
const domain = require('./governance/operatingWorkflow');
const adapter = require('./governance/connectorAdapter');

async function runOnce(connector) {
  if (!domain.operationSpecs[connector]) throw new Error('CONNECTOR_WORKER_NAME is invalid');
  const claimed = await db.query(
    `WITH candidate AS (SELECT id FROM company_connector_outbox WHERE connector=$1 AND ((status IN('pending','retry') AND available_at<=NOW()) OR (status='leased' AND lease_until<NOW())) ORDER BY available_at,id FOR UPDATE SKIP LOCKED LIMIT 1)
     UPDATE company_connector_outbox o SET status='leased',attempts=attempts+1,lease_until=NOW()+interval '2 minutes',updated_at=NOW() FROM candidate WHERE o.id=candidate.id RETURNING o.*`, [connector]);
  if (!claimed.rowCount) return false;
  const job = claimed.rows[0];
  try {
    const receipt = await adapter.dispatch(job, adapter.configuration());
    await db.query("UPDATE company_connector_outbox SET provider_receipt=$1,lease_until=NOW()+interval '30 minutes',updated_at=NOW() WHERE id=$2", [receipt, job.id]);
  } catch (error) {
    const policy = domain.retry(Math.max(0, job.attempts - 1), true);
    await db.query("UPDATE company_connector_outbox SET status=$1,attempts=$2,available_at=NOW()+($3*interval '1 second'),lease_until=NULL,last_error=$4,updated_at=NOW() WHERE id=$5", [policy.status, policy.attempts, policy.delaySeconds || 0, error.message.slice(0,1000), job.id]);
  }
  return true;
}

async function main() { const connector = process.env.CONNECTOR_WORKER_NAME; const once = process.argv.includes('--once'); do { const worked = await runOnce(connector); if (once) break; await new Promise((resolve) => setTimeout(resolve, worked ? 100 : 2000)); } while (true); }
if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => process.argv.includes('--once') && db.end());
module.exports = { runOnce };
