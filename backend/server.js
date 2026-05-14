require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/sources', require('./routes/sources'));
app.use('/api/events', require('./routes/events'));
app.use('/api/insights', require('./routes/insights'));
app.use('/api/anomalies', require('./routes/anomalies'));
app.use('/api/queries', require('./routes/queries'));
app.use('/api/health', require('./routes/health'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/export', require('./routes/exportCsv'));
app.use('/api/search', require('./routes/search'));
app.use('/api/admin', require('./routes/sample_data'));

const PORT = process.env.PORT || 3016;
app.listen(PORT, () => console.log(`CompanyOS backend running on port ${PORT}`));
app.use('/api/gap-ai-query-suggest', require('./routes/gap-ai-query-suggest'));
app.use('/api/gap-ai-source-onboarding-agent', require('./routes/gap-ai-source-onboarding-agent'));
app.use('/api/gap-ai-spec-generator', require('./routes/gap-ai-spec-generator'));
app.use('/api/gap-ai-agent-task-dispatcher', require('./routes/gap-ai-agent-task-dispatcher'));
app.use('/api/gap-ai-decision-replay', require('./routes/gap-ai-decision-replay'));
app.use('/api/gap-nonai-connectors', require('./routes/gap-nonai-connectors'));
app.use('/api/gap-nonai-webhook-ingest', require('./routes/gap-nonai-webhook-ingest'));
app.use('/api/gap-nonai-alerting', require('./routes/gap-nonai-alerting'));
app.use('/api/gap-nonai-rbac', require('./routes/gap-nonai-rbac'));
app.use('/api/gap-nonai-pii-redaction', require('./routes/gap-nonai-pii-redaction'));
app.use('/api/gap-nonai-transcripts', require('./routes/gap-nonai-transcripts'));
app.use('/api/cf-connector-marketplace', require('./routes/cf-connector-marketplace'));
app.use('/api/cf-closed-loop-tickets', require('./routes/cf-closed-loop-tickets'));
app.use('/api/cf-embeddings-index', require('./routes/cf-embeddings-index'));
app.use('/api/cf-intent-graph', require('./routes/cf-intent-graph'));
app.use('/api/cf-self-improving-queries', require('./routes/cf-self-improving-queries'));

// Deep-feature routes (audit 2026-05-14)
app.use('/api/kpis', require('./routes/kpis'));
app.use('/api/workflows', require('./routes/workflows'));
