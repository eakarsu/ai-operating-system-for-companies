'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const domain = require('./operatingWorkflow');
const adapter = require('./connectorAdapter');

test('connector adapter sends authenticated typed work and validates receipt', async()=>{
  const source=domain.connectorJob({id:'wf1',version:2,connector:'crm',operation:'upsert_account',tenantId:'t1',payload:{accountRef:'acct-1',name:'Acme'}});
  const job={...source,idempotency_key:source.idempotencyKey,payload_digest:source.payloadDigest,status:'leased'};let request;
  const receipt=await adapter.dispatch(job,{crm:{url:'https://crm.invalid',token:'connector-token-long-enough'}},async(url,options)=>{request={url:String(url),options};return{status:202,json:async()=>({receiptId:'receipt-1'})}});
  assert.equal(receipt,'receipt-1');assert.equal(request.options.headers['idempotency-key'],source.idempotencyKey);assert.equal(request.options.headers['x-payload-sha256'],source.payloadDigest);
});
test('connector adapter rejects payload drift, missing configuration, and bad receipts',async()=>{
  const source=domain.connectorJob({id:'wf1',version:2,connector:'crm',operation:'upsert_account',tenantId:'t1',payload:{accountRef:'acct-1',name:'Acme'}});const job={...source,idempotency_key:source.idempotencyKey,payload_digest:source.payloadDigest,status:'leased'};
  await assert.rejects(adapter.dispatch({...job,payload:{...job.payload,input:{accountRef:'acct-2',name:'Acme'}}},{crm:{url:'https://crm.invalid',token:'connector-token-long-enough'}}),/digest/);
  await assert.rejects(adapter.dispatch(job,{}),/not configured/);
  await assert.rejects(adapter.dispatch(job,{crm:{url:'https://crm.invalid',token:'connector-token-long-enough'}},async()=>({status:202,json:async()=>({})})),/receiptId/);
});
