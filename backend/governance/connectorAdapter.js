'use strict';
const domain = require('./operatingWorkflow');

function configuration(environment = process.env) {
  let endpoints; let tokens;
  try { endpoints = JSON.parse(environment.CONNECTOR_ENDPOINTS_JSON || '{}'); tokens = JSON.parse(environment.CONNECTOR_TOKENS_JSON || '{}'); }
  catch { throw new Error('connector configuration must be valid JSON'); }
  const configured = {};
  for (const connector of Object.keys(domain.operationSpecs)) {
    if (!endpoints[connector] || !tokens[connector] || String(tokens[connector]).length < 16) continue;
    const url = new URL(endpoints[connector]);
    if (environment.NODE_ENV === 'production' && url.protocol !== 'https:') throw new Error(`${connector} connector must use HTTPS`);
    configured[connector] = { url: url.toString(), token: String(tokens[connector]) };
  }
  return configured;
}

async function dispatch(job, connectors, fetchImpl = fetch) {
  if (job.status !== 'leased') throw new Error('connector job must be leased');
  domain.validatePayload(job.connector, job.operation, job.payload.input);
  if (domain.digest(job.payload) !== job.payload_digest) throw new Error('connector payload digest mismatch');
  const connector = connectors[job.connector];
  if (!connector) throw new Error(`connector is not configured: ${job.connector}`);
  const response = await fetchImpl(new URL('/v1/operations', connector.url), {
    method: 'POST', headers: { authorization: `Bearer ${connector.token}`, 'content-type': 'application/json', 'idempotency-key': job.idempotency_key, 'x-payload-sha256': job.payload_digest },
    body: JSON.stringify({ operation: job.operation, payload: job.payload.input, callbackReference: job.idempotency_key }), signal: AbortSignal.timeout(15_000)
  });
  if (![200,202].includes(response.status)) throw new Error(`connector returned HTTP ${response.status}`);
  const receipt = await response.json();
  if (typeof receipt.receiptId !== 'string' || receipt.receiptId.length < 4) throw new Error('connector omitted receiptId');
  return receipt.receiptId;
}
module.exports = { configuration, dispatch };
