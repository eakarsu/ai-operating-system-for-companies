CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  connection_string TEXT,
  sync_frequency VARCHAR(50) DEFAULT 'hourly',
  status VARCHAR(30) DEFAULT 'active',
  last_synced_at TIMESTAMP,
  record_count INTEGER DEFAULT 0,
  description TEXT,
  owner VARCHAR(255),
  tags TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  source_id INT REFERENCES data_sources(id) ON DELETE SET NULL,
  event_type VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  payload JSONB,
  severity VARCHAR(20) DEFAULT 'info',
  status VARCHAR(30) DEFAULT 'new',
  occurred_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS insights (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'operational',
  content TEXT,
  confidence_score DECIMAL,
  impact VARCHAR(20) DEFAULT 'medium',
  action_required BOOLEAN DEFAULT FALSE,
  assigned_to VARCHAR(255),
  status VARCHAR(30) DEFAULT 'new',
  tags TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anomalies (
  id SERIAL PRIMARY KEY,
  source_id INT REFERENCES data_sources(id) ON DELETE SET NULL,
  metric_name VARCHAR(255) NOT NULL,
  expected_value DECIMAL,
  actual_value DECIMAL,
  deviation_pct DECIMAL,
  severity VARCHAR(20) DEFAULT 'medium',
  description TEXT,
  status VARCHAR(30) DEFAULT 'open',
  detected_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_queries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  query_text TEXT NOT NULL,
  query_type VARCHAR(50) DEFAULT 'natural_language',
  result_summary TEXT,
  tags TEXT,
  is_scheduled BOOLEAN DEFAULT FALSE,
  schedule_frequency VARCHAR(50),
  run_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS health_scores (
  id SERIAL PRIMARY KEY,
  department VARCHAR(255) NOT NULL,
  overall_score DECIMAL,
  productivity_score DECIMAL,
  velocity_score DECIMAL,
  quality_score DECIMAL,
  collaboration_score DECIMAL,
  trend VARCHAR(20) DEFAULT 'stable',
  notes TEXT,
  period VARCHAR(50),
  recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS activity_log_created_idx ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_log_entity_idx ON activity_log(entity_type, entity_id);

-- ============================================================================
-- Deep-feature tables (audit pass 2026-05-14)
-- AI Operating System: department graph, cross-functional workflows,
-- agent orchestration, SaaS connectors, decision logs, KPI registry.
-- ============================================================================

-- Departments form the org graph: sales, finance, ops, HR, support, engineering, marketing, product.
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(60) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  parent_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  head_email VARCHAR(255),
  headcount INTEGER DEFAULT 0,
  charter TEXT,
  cost_center VARCHAR(60),
  primary_kpis TEXT, -- comma-separated KPI slugs
  upstream_deps TEXT, -- comma-separated department slugs they consume from
  downstream_deps TEXT, -- comma-separated department slugs they feed into
  created_at TIMESTAMP DEFAULT NOW()
);

-- Real SaaS connectors with sync state (Salesforce, HubSpot, NetSuite, QuickBooks, Slack, Gmail, etc.)
CREATE TABLE IF NOT EXISTS connectors (
  id SERIAL PRIMARY KEY,
  vendor VARCHAR(60) NOT NULL,        -- 'salesforce', 'hubspot', 'netsuite', ...
  display_name VARCHAR(160) NOT NULL,
  category VARCHAR(60),               -- crm, accounting, comm, etc.
  auth_type VARCHAR(30),              -- oauth2, api_key, basic
  api_base_url TEXT,
  oauth_scopes TEXT,
  webhook_url TEXT,
  status VARCHAR(30) DEFAULT 'connected', -- connected, error, paused, oauth_pending
  health VARCHAR(30) DEFAULT 'green',     -- green, yellow, red
  last_sync_at TIMESTAMP,
  next_sync_at TIMESTAMP,
  records_synced BIGINT DEFAULT 0,
  records_failed BIGINT DEFAULT 0,
  rate_limit_per_min INTEGER,
  cost_per_month_cents INTEGER DEFAULT 0,
  owner_department VARCHAR(60),
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS connectors_vendor_idx ON connectors(vendor);
CREATE INDEX IF NOT EXISTS connectors_status_idx ON connectors(status);

-- Cross-functional workflow runs: lead -> quote -> contract -> invoice -> cash
CREATE TABLE IF NOT EXISTS workflows (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(40),          -- 'event', 'cron', 'manual', 'agent'
  departments TEXT,                  -- comma-separated owners
  step_definition JSONB,             -- ordered list of step specs
  sla_hours INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER REFERENCES workflows(id) ON DELETE CASCADE,
  external_ref VARCHAR(160),         -- e.g. SFDC opportunity id
  subject TEXT,                      -- 'Acme Corp - 250-seat renewal'
  current_step VARCHAR(80),
  status VARCHAR(30) DEFAULT 'running', -- running, blocked, succeeded, failed, cancelled
  amount_usd DECIMAL,
  started_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP,
  sla_breached BOOLEAN DEFAULT FALSE,
  context JSONB
);
CREATE INDEX IF NOT EXISTS workflow_runs_status_idx ON workflow_runs(status);
CREATE INDEX IF NOT EXISTS workflow_runs_wf_idx ON workflow_runs(workflow_id);

CREATE TABLE IF NOT EXISTS workflow_steps (
  id SERIAL PRIMARY KEY,
  run_id INTEGER REFERENCES workflow_runs(id) ON DELETE CASCADE,
  step_name VARCHAR(80) NOT NULL,
  step_order INTEGER,
  status VARCHAR(30) DEFAULT 'pending', -- pending, running, ok, failed, skipped
  agent VARCHAR(80),                  -- e.g. 'planner', 'salesforce-agent'
  connector_id INTEGER REFERENCES connectors(id) ON DELETE SET NULL,
  input JSONB,
  output JSONB,
  decision_id INTEGER, -- soft FK to decision_log.id
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  duration_ms INTEGER
);
CREATE INDEX IF NOT EXISTS workflow_steps_run_idx ON workflow_steps(run_id);

-- Agent registry + runs + traces (planner agent, function-calling, MCP-style tools)
CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(160) NOT NULL,
  role VARCHAR(80),                  -- planner, executor, evaluator, router
  department VARCHAR(60),
  model VARCHAR(80),                 -- e.g. 'anthropic/claude-haiku-4.5'
  tool_slugs TEXT,                   -- comma-separated tool slugs available
  system_prompt TEXT,
  cost_per_1k_tokens_cents DECIMAL DEFAULT 0,
  success_rate_pct DECIMAL,
  avg_latency_ms INTEGER,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- MCP-style tool catalog
CREATE TABLE IF NOT EXISTS agent_tools (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(160) NOT NULL,
  connector_vendor VARCHAR(60),      -- which SaaS provides the tool
  description TEXT,
  input_schema JSONB,                -- JSON Schema for tool args
  output_schema JSONB,
  side_effect VARCHAR(20) DEFAULT 'read', -- read, write, irreversible
  approval_required BOOLEAN DEFAULT FALSE,
  call_count BIGINT DEFAULT 0,
  error_rate_pct DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id) ON DELETE SET NULL,
  workflow_run_id INTEGER REFERENCES workflow_runs(id) ON DELETE SET NULL,
  goal TEXT NOT NULL,
  plan JSONB,
  status VARCHAR(30) DEFAULT 'running',
  steps_planned INTEGER DEFAULT 0,
  steps_completed INTEGER DEFAULT 0,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  cost_cents INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP,
  outcome TEXT
);
CREATE INDEX IF NOT EXISTS agent_runs_agent_idx ON agent_runs(agent_id);

CREATE TABLE IF NOT EXISTS agent_tool_calls (
  id SERIAL PRIMARY KEY,
  agent_run_id INTEGER REFERENCES agent_runs(id) ON DELETE CASCADE,
  tool_slug VARCHAR(80) NOT NULL,
  call_order INTEGER,
  args JSONB,
  result JSONB,
  status VARCHAR(30) DEFAULT 'ok', -- ok, error, timeout, denied
  latency_ms INTEGER,
  error_msg TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Decision log: which agent (or human) decided what, with what data
CREATE TABLE IF NOT EXISTS decision_log (
  id SERIAL PRIMARY KEY,
  agent_run_id INTEGER REFERENCES agent_runs(id) ON DELETE SET NULL,
  workflow_run_id INTEGER REFERENCES workflow_runs(id) ON DELETE SET NULL,
  decision_type VARCHAR(80),         -- e.g. 'pricing_approval', 'route_to_human'
  actor VARCHAR(120),                -- 'agent:planner', 'human:dianna@'
  subject TEXT,
  rationale TEXT,
  evidence JSONB,                    -- the data the actor saw
  alternatives_considered JSONB,
  confidence_pct DECIMAL,
  reversible BOOLEAN DEFAULT TRUE,
  reverted_at TIMESTAMP,
  human_approved BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS decision_log_type_idx ON decision_log(decision_type);
CREATE INDEX IF NOT EXISTS decision_log_actor_idx ON decision_log(actor);

-- KPI registry + snapshots (CAC, LTV, NRR, burn multiple, etc.)
CREATE TABLE IF NOT EXISTS kpis (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(60) UNIQUE NOT NULL,
  name VARCHAR(160) NOT NULL,
  department VARCHAR(60),
  unit VARCHAR(30),                  -- 'usd', 'pct', 'ratio', 'days'
  formula TEXT,                      -- human-readable formula
  source_connectors TEXT,            -- comma-separated vendor slugs
  target_value DECIMAL,
  good_direction VARCHAR(8) DEFAULT 'up', -- up or down
  cadence VARCHAR(30) DEFAULT 'monthly',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kpi_snapshots (
  id SERIAL PRIMARY KEY,
  kpi_id INTEGER REFERENCES kpis(id) ON DELETE CASCADE,
  period VARCHAR(20),                -- '2026-Q1', '2026-04'
  value DECIMAL,
  prev_value DECIMAL,
  delta_pct DECIMAL,
  status VARCHAR(20),                -- 'green', 'yellow', 'red'
  notes TEXT,
  recorded_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS kpi_snapshots_kpi_idx ON kpi_snapshots(kpi_id, recorded_at DESC);

-- Closed-loop tickets generated from anomalies/insights
CREATE TABLE IF NOT EXISTS closed_loop_tickets (
  id SERIAL PRIMARY KEY,
  source_type VARCHAR(40),           -- 'anomaly', 'insight', 'kpi_breach', 'manual'
  source_id INTEGER,
  title VARCHAR(255) NOT NULL,
  spec TEXT,                         -- agent-executable spec
  assignee VARCHAR(120),             -- 'agent:executor' or 'human:joe@'
  external_url TEXT,                 -- e.g. linear.app/team/ABC-123
  status VARCHAR(30) DEFAULT 'open', -- open, in_progress, resolved, wont_fix
  priority VARCHAR(20) DEFAULT 'medium',
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  loop_closed_kpi VARCHAR(60),       -- KPI slug this ticket targets
  baseline_value DECIMAL,
  outcome_value DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS closed_loop_tickets_status_idx ON closed_loop_tickets(status);

-- ============================================================================
-- Pass 7: full backlog implementation tables
-- Real, DB-backed replacements for the auto-scaffolded gap-* / cf-* routes.
-- ============================================================================

-- gap-nonai-rbac: roles, permissions, user-role assignments
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(60) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  permissions TEXT, -- comma-separated permission keys
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  role_slug VARCHAR(60) NOT NULL,
  granted_by VARCHAR(255),
  granted_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS user_roles_email_idx ON user_roles(user_email);

-- gap-nonai-alerting: alert rules and fired alerts
CREATE TABLE IF NOT EXISTS alert_rules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  entity_type VARCHAR(60) NOT NULL, -- 'anomaly','event','kpi','health'
  match_field VARCHAR(60),          -- e.g. 'severity','status','metric_name'
  match_value VARCHAR(120),
  operator VARCHAR(10) DEFAULT '=', -- =, !=, >, <, contains
  channel VARCHAR(40) NOT NULL,     -- 'email','slack','webhook','in_app'
  destination TEXT,                 -- email, channel id, url
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS alert_events (
  id SERIAL PRIMARY KEY,
  rule_id INTEGER REFERENCES alert_rules(id) ON DELETE SET NULL,
  entity_type VARCHAR(60),
  entity_id INTEGER,
  channel VARCHAR(40),
  destination TEXT,
  payload JSONB,
  status VARCHAR(20) DEFAULT 'queued', -- queued, sent, ack, failed
  fired_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS alert_events_fired_idx ON alert_events(fired_at DESC);

-- gap-nonai-pii-redaction: redaction policies + redacted log
CREATE TABLE IF NOT EXISTS pii_policies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  pattern_type VARCHAR(40) NOT NULL, -- 'email','phone','ssn','credit_card','custom'
  custom_regex TEXT,
  replacement VARCHAR(60) DEFAULT '[REDACTED]',
  retention_days INTEGER DEFAULT 90,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS pii_redactions (
  id SERIAL PRIMARY KEY,
  policy_id INTEGER REFERENCES pii_policies(id) ON DELETE SET NULL,
  source_text_hash VARCHAR(64),
  matches_count INTEGER DEFAULT 0,
  redacted_preview TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- gap-nonai-transcripts: call recordings / transcript ingest
CREATE TABLE IF NOT EXISTS transcripts (
  id SERIAL PRIMARY KEY,
  source VARCHAR(60),               -- 'gong','zoom','meet','manual'
  external_id VARCHAR(160),
  title VARCHAR(255),
  participants TEXT,
  meeting_at TIMESTAMP,
  duration_min INTEGER,
  body TEXT,
  summary TEXT,
  action_items TEXT,
  sentiment VARCHAR(20),
  tags TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS transcripts_meeting_idx ON transcripts(meeting_at DESC);

-- gap-nonai-webhook-ingest: inbound webhook subscriptions + delivery log
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(80) UNIQUE NOT NULL,
  vendor VARCHAR(80),
  description TEXT,
  secret VARCHAR(120),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id SERIAL PRIMARY KEY,
  subscription_slug VARCHAR(80) NOT NULL,
  event_type VARCHAR(120),
  headers JSONB,
  payload JSONB,
  status VARCHAR(20) DEFAULT 'received',
  received_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS webhook_deliveries_sub_idx ON webhook_deliveries(subscription_slug, received_at DESC);

-- gap-nonai-connectors: lightweight connector wiring scripts (separate from
-- the full cf-connector-marketplace catalog; this stores per-tenant snippets
-- that engineers register to wire a vendor into a specific event topic).
CREATE TABLE IF NOT EXISTS connector_scripts (
  id SERIAL PRIMARY KEY,
  vendor VARCHAR(60) NOT NULL,
  topic VARCHAR(80),
  language VARCHAR(20) DEFAULT 'javascript',
  body TEXT,
  active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMP,
  last_run_status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- gap-ai-query-suggest: suggestion log (uses existing saved_queries for source)
CREATE TABLE IF NOT EXISTS query_suggestions (
  id SERIAL PRIMARY KEY,
  context TEXT,
  suggestions JSONB,
  picked_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- gap-ai-source-onboarding-agent: onboarding plans for new sources
CREATE TABLE IF NOT EXISTS source_onboarding_plans (
  id SERIAL PRIMARY KEY,
  vendor VARCHAR(80),
  goal TEXT,
  plan JSONB,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW()
);

-- cf-self-improving-queries: rating feedback against saved_queries
CREATE TABLE IF NOT EXISTS query_feedback (
  id SERIAL PRIMARY KEY,
  query_id INTEGER REFERENCES saved_queries(id) ON DELETE CASCADE,
  rating INTEGER,                   -- 1-5
  was_useful BOOLEAN,
  comment TEXT,
  improved_text TEXT,               -- proposed better version
  applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS query_feedback_query_idx ON query_feedback(query_id);
