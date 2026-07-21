'use strict';
require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');

function createApp() {
  const app = express();
  const origins = String(process.env.CORS_ORIGIN || '').split(',').map((value) => value.trim()).filter(Boolean);
  if (process.env.NODE_ENV === 'production' && !origins.length) throw new Error('CORS_ORIGIN is required in production');
  const generated = process.env.ENABLE_GENERATED_FEATURES === 'true' && process.env.NODE_ENV !== 'production';
  app.disable('x-powered-by');
  app.use((_req, res, next) => { res.set('X-Content-Type-Options','nosniff'); res.set('Referrer-Policy','no-referrer'); res.set('Permissions-Policy','camera=(), microphone=(), geolocation=()'); next(); });
  app.use(cors({ origin: origins.length ? origins : false }));
  app.use(express.json({ limit: '256kb', type: ['application/json','application/*+json'] }));
  app.get('/healthz', async (_req, res) => { try { const db = require('./db'); const result = await db.query("SELECT to_regclass('public.governed_workflows') IS NOT NULL AS migrated"); res.status(result.rows[0].migrated ? 200 : 503).json({ ok: result.rows[0].migrated, migrations: result.rows[0].migrated }); } catch { res.status(503).json({ ok: false }); } });
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/governed-workflows', require('./routes/governedWorkflow'));
  app.use('/api/dashboard', require('./routes/dashboard'));
  app.use('/api/sources', require('./routes/sources'));
  app.use('/api/events', require('./routes/events'));
  app.use('/api/insights', require('./routes/insights'));
  app.use('/api/anomalies', require('./routes/anomalies'));
  app.use('/api/queries', require('./routes/queries'));
  app.use('/api/health', require('./routes/health'));
  app.use('/api/activity', require('./routes/activity'));
  app.use('/api/export', require('./routes/exportCsv'));
  app.use('/api/search', require('./routes/search'));
  if (generated) {
    app.use('/api/ai', require('./routes/ai'));
    app.use('/api/admin', require('./routes/sample_data'));
    for (const route of ['gap-ai-query-suggest','gap-ai-source-onboarding-agent','gap-ai-spec-generator','gap-ai-agent-task-dispatcher','gap-ai-decision-replay','gap-nonai-connectors','gap-nonai-webhook-ingest','gap-nonai-alerting','gap-nonai-rbac','gap-nonai-pii-redaction','gap-nonai-transcripts','cf-connector-marketplace','cf-closed-loop-tickets','cf-embeddings-index','cf-intent-graph','cf-self-improving-queries']) app.use(`/api/${route}`, require(`./routes/${route}`));
    app.use('/api/workflows', require('./routes/workflows'));
    app.use('/api/custom-views', require('./routes/customViews'));
    app.use('/api/policy-drift', require('./routes/policyDriftSimulator'));
  } else app.use(['/api/ai','/api/admin','/api/gap-ai','/api/gap-nonai','/api/cf-'], (_req,res) => res.status(410).json({ error: 'Generated and ungrounded demo endpoints are disabled' }));
  app.use('/api/kpis', require('./routes/kpis'));
  app.use('/api', (req,res) => res.status(404).json({ error:'Not found', path:req.originalUrl }));
  app.use((error,_req,res,_next) => { if (error.type === 'entity.too.large') return res.status(413).json({ error:'Request too large' }); console.error(error.stack); res.status(500).json({ error:'Internal server error' }); });
  return app;
}

if (require.main === module) { const port = Number(process.env.PORT || 3016); const host = process.env.HOST || '127.0.0.1'; createApp().listen(port, host, () => console.log(`CompanyOS backend running at http://${host}:${port}`)); }
module.exports = { createApp };
