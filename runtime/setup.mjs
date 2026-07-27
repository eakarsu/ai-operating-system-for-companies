import crypto from 'node:crypto';
import { executeScript, literal } from './db.mjs';

const email=String(process.env.PROVISION_ADMIN_EMAIL||process.env.ADMIN_EMAIL||'').trim().toLowerCase();
const password=String(process.env.PROVISION_ADMIN_PASSWORD||process.env.ADMIN_PASSWORD||'');
if(!email||password.length<12)throw new Error('Runtime administrator credentials are required');
const salt=crypto.randomBytes(16).toString('hex');
const hash='scrypt$'+salt+'$'+crypto.scryptSync(password,salt,32).toString('hex');
executeScript(`
  BEGIN;
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  CREATE TABLE IF NOT EXISTS runtime_app_users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'user',active BOOLEAN NOT NULL DEFAULT TRUE,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS runtime_app_sessions(
    token_hash TEXT PRIMARY KEY,user_id UUID NOT NULL REFERENCES runtime_app_users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS runtime_ai_interactions(
    id BIGSERIAL PRIMARY KEY,user_id UUID NOT NULL REFERENCES runtime_app_users(id),feature TEXT NOT NULL,
    input JSONB NOT NULL,output JSONB NOT NULL,model TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS runtime_ai_interactions_user_idx ON runtime_ai_interactions(user_id,created_at DESC);
  CREATE TABLE IF NOT EXISTS chief_of_staff_commitments(
    id BIGSERIAL PRIMARY KEY,source_type TEXT NOT NULL,source_ref TEXT NOT NULL UNIQUE,title TEXT NOT NULL,
    accountable_owner TEXT NOT NULL,stakeholders JSONB NOT NULL DEFAULT '[]'::jsonb,due_at TIMESTAMPTZ NOT NULL,
    business_impact TEXT NOT NULL,risk TEXT NOT NULL CHECK(risk IN('low','medium','high','critical')),
    draft_output JSONB NOT NULL DEFAULT '{}'::jsonb,human_approval_required BOOLEAN NOT NULL DEFAULT TRUE,
    status TEXT NOT NULL CHECK(status IN('captured','drafted','review','approved','closed')),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  INSERT INTO chief_of_staff_commitments(source_type,source_ref,title,accountable_owner,stakeholders,due_at,business_impact,risk,draft_output,status)
  SELECT (ARRAY['meeting','email','document','calendar'])[((g-1)%4)+1],'COS-'||LPAD(g::text,3,'0'),
    (ARRAY['Finalize enterprise renewal decision','Resolve launch-readiness dependency','Prepare board operating update','Close customer escalation','Approve hiring-plan revision'])[((g-1)%5)+1]||' · '||g,
    (ARRAY['Chief Revenue Officer','VP Product','Chief Operating Officer','Customer Success Director','VP People'])[((g-1)%5)+1],
    jsonb_build_array('Executive sponsor','Operating owner','Finance partner'),NOW()+(g||' days')::interval,
    (ARRAY['Revenue retention','Release confidence','Board transparency','Customer trust','Capacity alignment'])[((g-1)%5)+1],
    (ARRAY['medium','high','critical','high','low'])[((g-1)%5)+1],
    jsonb_build_object('brief','Draft decision brief prepared from approved source context','nextAction','Human owner must verify facts and approve communication','sendAutomatically',false),
    (ARRAY['captured','drafted','review','approved','closed'])[((g-1)%5)+1]
  FROM generate_series(1,15) g ON CONFLICT(source_ref) DO NOTHING;
  INSERT INTO runtime_app_users(email,password_hash,display_name,role,active)
  VALUES(${literal(email)},${literal(hash)},'Runtime Administrator','admin',TRUE)
  ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash,role='admin',active=TRUE;
  COMMIT;
`);
console.log('Runtime identity and AI persistence reconciled.');
