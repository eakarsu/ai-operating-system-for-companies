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
