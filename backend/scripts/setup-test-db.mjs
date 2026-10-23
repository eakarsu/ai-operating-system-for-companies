import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = path.dirname(fileURLToPath(import.meta.url));
const testUrl = String(process.env.TEST_DATABASE_URL || '');
if (!testUrl) throw new Error('TEST_DATABASE_URL is required');
const parsed = new URL(testUrl);
const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
if (!dbName.endsWith('_test')) throw new Error('Dedicated test database name must end in _test');

const maintenance = new URL(testUrl);
maintenance.pathname = '/postgres';
const admin = new pg.Client({ connectionString: maintenance.toString() });
await admin.connect();
const existing = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
if (!existing.rowCount) await admin.query(`CREATE DATABASE "${dbName.replaceAll('"', '""')}"`);
await admin.end();

const client = new pg.Client({ connectionString: testUrl });
await client.connect();
const migrated = await client.query("SELECT to_regclass('public.governed_workflows') AS name");
if (!migrated.rows[0].name) {
  for (const file of ['../db/schema.sql', '../db/migrations/001_governed_workflow.sql', '../db/seed.sql']) {
    await client.query(fs.readFileSync(path.join(root, file), 'utf8'));
  }
  console.log(`Dedicated test database ${dbName} migrated`);
} else {
  console.log(`Dedicated test database ${dbName} already migrated`);
}
await client.end();
