// Source Onboarding Agent — turns "I want to add vendor X" into an ordered
// onboarding plan (auth, scopes, sync schedule, KPIs to populate, owner).
// Deterministic plan derived from the cf-connector-marketplace catalog when
// no LLM key; uses LLM to enrich rationale when available. Persists plans
// in source_onboarding_plans.

const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');

router.use(verifyToken);

async function ensureTables() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS source_onboarding_plans (
      id SERIAL PRIMARY KEY,
      vendor VARCHAR(80),
      goal TEXT,
      plan JSONB,
      status VARCHAR(20) DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch (e) { /* swallow */ }
}

const VENDOR_HINTS = {
  salesforce: { dept: 'sales',        kpis: ['win_rate','pipeline_coverage'], auth: 'oauth2', scopes: 'api,refresh_token,offline_access', cadence: 'hourly' },
  hubspot:    { dept: 'marketing',    kpis: ['cac','mql_to_sql'],            auth: 'oauth2', scopes: 'contacts,oauth,content',           cadence: 'hourly' },
  netsuite:   { dept: 'finance',      kpis: ['burn_multiple','arr'],         auth: 'oauth2', scopes: 'rest_webservices',                 cadence: 'daily'  },
  quickbooks: { dept: 'finance',      kpis: ['burn_multiple'],               auth: 'oauth2', scopes: 'com.intuit.quickbooks.accounting', cadence: 'daily'  },
  slack:      { dept: 'engineering',  kpis: ['mttr'],                        auth: 'oauth2', scopes: 'channels:history,users:read',      cadence: 'realtime' },
  gmail:      { dept: 'sales',        kpis: ['win_rate'],                    auth: 'oauth2', scopes: 'gmail.readonly',                   cadence: 'hourly' },
  github:     { dept: 'engineering',  kpis: ['mttr','velocity'],             auth: 'oauth2', scopes: 'repo,read:org,read:user',          cadence: 'hourly' },
  linear:     { dept: 'engineering',  kpis: ['velocity'],                    auth: 'oauth2', scopes: 'read,write',                       cadence: 'hourly' },
  stripe:     { dept: 'finance',      kpis: ['mrr','churn'],                 auth: 'api_key', scopes: '',                                cadence: 'realtime' },
  zendesk:    { dept: 'support',      kpis: ['csat'],                        auth: 'oauth2', scopes: 'tickets:read,users:read',          cadence: 'hourly' },
  intercom:   { dept: 'support',      kpis: ['csat'],                        auth: 'oauth2', scopes: 'read,write',                       cadence: 'hourly' },
  greenhouse: { dept: 'hr',           kpis: ['time_to_fill'],                auth: 'api_key', scopes: '',                                cadence: 'daily'  },
  notion:     { dept: 'ops',          kpis: [],                              auth: 'oauth2', scopes: 'read_content,update_content',      cadence: 'daily'  },
  jira:       { dept: 'engineering',  kpis: ['velocity','mttr'],             auth: 'oauth2', scopes: 'read:jira-work,write:jira-work',   cadence: 'hourly' },
  workday:    { dept: 'hr',           kpis: ['time_to_fill'],                auth: 'oauth2', scopes: '',                                 cadence: 'daily'  },
};

async function callAI(systemPrompt, userPrompt) {
  if (!process.env.OPENROUTER_API_KEY) return null;
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'Source Onboarding Agent'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) { return null; }
}

router.post('/plan', async (req, res) => {
  try {
    await ensureTables();
    const { vendor, goal } = req.body || {};
    if (!vendor) return res.status(400).json({ error: 'vendor required' });
    const hint = VENDOR_HINTS[vendor.toLowerCase()] || { dept: 'ops', kpis: [], auth: 'api_key', scopes: '', cadence: 'daily' };

    const steps = [
      { order: 1, name: 'register_app',  description: `Register a ${hint.auth} app with ${vendor}.`, owner: 'platform' },
      { order: 2, name: 'capture_secret', description: `Store secret/PAT in vault; configure ${hint.auth === 'oauth2' ? 'redirect URI' : 'API key'}.`, owner: 'platform' },
      { order: 3, name: 'grant_scopes',  description: `Request scopes: ${hint.scopes || '(vendor default)'}.`, owner: 'platform' },
      { order: 4, name: 'first_sync',    description: `Backfill last 30 days; verify record_count > 0.`, owner: 'data' },
      { order: 5, name: 'schedule_sync', description: `Schedule sync at cadence: ${hint.cadence}.`, owner: 'data' },
      { order: 6, name: 'wire_kpis',     description: hint.kpis.length ? `Wire to KPIs: ${hint.kpis.join(', ')}.` : 'Identify KPIs this source should feed.', owner: hint.dept },
      { order: 7, name: 'set_owner',     description: `Assign owning department: ${hint.dept}.`, owner: hint.dept },
      { order: 8, name: 'add_alerts',    description: `Create alert rule for sync failure / record_count drop.`, owner: 'platform' }
    ];

    let rationale = `Generated from vendor catalog: dept=${hint.dept}, auth=${hint.auth}, cadence=${hint.cadence}.`;
    let llm_used = false;
    const raw = await callAI(
      `You enrich a source-onboarding plan. Reply with STRICT JSON {"rationale":"...", "risks":["..."], "estimated_days": n}.`,
      `Vendor: ${vendor}\nGoal: ${goal || '(none)'}\nPlan: ${JSON.stringify(steps)}\nHint: ${JSON.stringify(hint)}`
    );
    let risks = ['OAuth scope creep', 'API quota exhaustion during backfill'];
    let estimated_days = hint.auth === 'oauth2' ? 2 : 1;
    if (raw) {
      try {
        const m = raw.match(/\{[\s\S]*\}/);
        if (m) {
          const parsed = JSON.parse(m[0]);
          if (parsed.rationale) { rationale = parsed.rationale; llm_used = true; }
          if (Array.isArray(parsed.risks))      risks = parsed.risks.slice(0, 6).map(String);
          if (Number.isFinite(parsed.estimated_days)) estimated_days = parsed.estimated_days;
        }
      } catch { /* keep deterministic */ }
    }

    const plan = { vendor, goal: goal || null, hint, steps, rationale, risks, estimated_days };
    const ins = await pool.query(
      `INSERT INTO source_onboarding_plans (vendor, goal, plan, status) VALUES ($1,$2,$3,'draft') RETURNING id, created_at`,
      [vendor, goal || null, plan]
    );
    res.json({ id: ins.rows[0].id, plan, llm_used });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/plans', async (_req, res) => {
  try {
    await ensureTables();
    const r = await pool.query('SELECT id, vendor, goal, status, created_at FROM source_onboarding_plans ORDER BY created_at DESC LIMIT 50');
    res.json({ plans: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/plans/:id', async (req, res) => {
  try {
    await ensureTables();
    const r = await pool.query('SELECT * FROM source_onboarding_plans WHERE id=$1', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ plan: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/plans/:id/status', async (req, res) => {
  try {
    await ensureTables();
    const { status } = req.body || {};
    if (!['draft','approved','executing','done','abandoned'].includes(status)) {
      return res.status(400).json({ error: 'status must be one of draft|approved|executing|done|abandoned' });
    }
    const r = await pool.query('UPDATE source_onboarding_plans SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ plan: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
