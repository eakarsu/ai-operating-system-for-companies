'use strict';

const crypto = require('node:crypto');
const bcrypt = require('bcrypt');
const db = require('../db');

async function main() {
  if (process.env.NODE_ENV !== 'test' && process.env.BOOTSTRAP_ACKNOWLEDGEMENT !== 'create-initial-admin') {
    throw new Error('Refusing administrator provisioning without explicit acknowledgement');
  }
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || '');
  const tenantId = String(process.env.TENANT_ID || process.env.GOVERNANCE_TENANT_ID || '').trim();
  if (!email || !email.includes('@') || password.length < 12 || !tenantId) {
    throw new Error('Explicit ADMIN_EMAIL, strong ADMIN_PASSWORD, and TENANT_ID are required');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await db.query(
    `INSERT INTO company_identities(id,tenant_id,email,password_hash,display_name,role,active)
     VALUES($1,$2,$3,$4,$5,'admin',TRUE)
     ON CONFLICT ((lower(email))) DO UPDATE SET
       tenant_id=EXCLUDED.tenant_id,password_hash=EXCLUDED.password_hash,display_name=EXCLUDED.display_name,role='admin',active=TRUE`,
    [crypto.randomUUID(), tenantId, email, passwordHash, 'Runtime Acceptance'],
  );
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => db.end());
