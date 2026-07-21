BEGIN;

CREATE TABLE IF NOT EXISTS company_identities (
  id UUID PRIMARY KEY, tenant_id TEXT NOT NULL, email TEXT NOT NULL, password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN('requester','reviewer','operator','admin')),
  active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(tenant_id,email)
);
CREATE UNIQUE INDEX IF NOT EXISTS company_identity_email_idx ON company_identities(lower(email));

CREATE TABLE IF NOT EXISTS governed_workflows (
  id UUID PRIMARY KEY, tenant_id TEXT NOT NULL, title TEXT NOT NULL, connector TEXT NOT NULL CHECK(connector IN('crm','accounting','ticketing','calendar','messaging','data_warehouse')),
  operation TEXT NOT NULL, owner_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'intake' CHECK(status IN('intake','validated','approval_pending','approved','dispatch_pending','delivery_failed','completed','rejected','cancelled')),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version > 0), acceptance_criteria JSONB NOT NULL, payload JSONB NOT NULL,
  result JSONB, acceptance_evidence JSONB, provider_receipt TEXT, last_error TEXT,
  idempotency_key TEXT NOT NULL, request_digest TEXT NOT NULL CHECK(request_digest ~ '^[a-f0-9]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(tenant_id,idempotency_key)
);

CREATE TABLE IF NOT EXISTS company_workflow_events (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, workflow_id UUID NOT NULL REFERENCES governed_workflows(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, from_status TEXT, to_status TEXT, actor_id TEXT NOT NULL, actor_role TEXT NOT NULL,
  reason TEXT, details JSONB NOT NULL DEFAULT '{}', occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION immutable_company_workflow_event() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'workflow events are append-only'; END $$;
DROP TRIGGER IF EXISTS company_workflow_events_immutable ON company_workflow_events;
CREATE TRIGGER company_workflow_events_immutable BEFORE UPDATE OR DELETE ON company_workflow_events FOR EACH ROW EXECUTE FUNCTION immutable_company_workflow_event();

CREATE TABLE IF NOT EXISTS company_connector_outbox (
  id BIGSERIAL PRIMARY KEY, tenant_id TEXT NOT NULL, workflow_id UUID NOT NULL REFERENCES governed_workflows(id) ON DELETE CASCADE,
  connector TEXT NOT NULL CHECK(connector IN('crm','accounting','ticketing','calendar','messaging','data_warehouse')),
  operation TEXT NOT NULL, idempotency_key TEXT NOT NULL, payload_digest TEXT NOT NULL CHECK(payload_digest ~ '^[a-f0-9]{64}$'), payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','leased','retry','succeeded','dead_letter')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 10), available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), lease_until TIMESTAMPTZ,
  provider_receipt TEXT, last_error TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(connector,idempotency_key)
);

CREATE TABLE IF NOT EXISTS company_connector_events (
  connector TEXT NOT NULL, event_id TEXT NOT NULL, idempotency_key TEXT NOT NULL, payload_digest TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK(outcome IN('succeeded','failed')), provider_receipt TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), processed_at TIMESTAMPTZ, PRIMARY KEY(connector,event_id)
);
CREATE INDEX IF NOT EXISTS governed_workflows_tenant_state_idx ON governed_workflows(tenant_id,status,updated_at);
CREATE INDEX IF NOT EXISTS company_connector_claim_idx ON company_connector_outbox(status,available_at,lease_until);
CREATE INDEX IF NOT EXISTS company_workflow_event_idx ON company_workflow_events(tenant_id,workflow_id,occurred_at);
COMMIT;
