const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

function aiUnavailable() {
  return !OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your_openrouter_api_key_here';
}

async function callAI(userPrompt, systemPrompt) {
  if (aiUnavailable()) {
    const err = new Error('AI service unavailable: OPENROUTER_API_KEY not configured');
    err.status = 503;
    throw err;
  }
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }] })
  });
  if (!res.ok) {
    const err = new Error(`AI provider error: ${res.status}`);
    err.status = 503;
    throw err;
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response from AI';
}

function handleErr(res, err) {
  const status = err.status || 500;
  res.status(status).json({ error: err.message });
}

// Generate insights from data
router.post('/generate-insights', auth, async (req, res) => {
  try {
    const { focus_area, time_range } = req.body;
    const [sources, events, anomalies] = await Promise.all([
      db.query('SELECT name, type, status, record_count FROM data_sources LIMIT 10'),
      db.query('SELECT event_type, title, severity, occurred_at FROM events ORDER BY occurred_at DESC LIMIT 15'),
      db.query('SELECT metric_name, deviation_pct, severity, detected_at FROM anomalies WHERE status = \'open\' LIMIT 10')
    ]);
    const context = `Data Sources: ${JSON.stringify(sources.rows)}\nRecent Events: ${JSON.stringify(events.rows)}\nOpen Anomalies: ${JSON.stringify(anomalies.rows)}`;
    const result = await callAI(
      `Focus area: ${focus_area || 'overall company health'}\nTime range: ${time_range || 'last 30 days'}\n\nData context:\n${context}`,
      'You are an AI operating system analyst for a company intelligence platform. Generate specific, actionable insights from operational data. Identify patterns, risks, and opportunities. Format with ## headers, bullet points, and highlight key metrics in **bold**.'
    );
    res.json({ result });
  } catch (err) { handleErr(res, err); }
});

// Natural language query
router.post('/query', auth, async (req, res) => {
  try {
    const { question } = req.body;
    const [sources, events, insights, anomalies, health] = await Promise.all([
      db.query('SELECT * FROM data_sources LIMIT 10'),
      db.query('SELECT * FROM events ORDER BY occurred_at DESC LIMIT 20'),
      db.query('SELECT * FROM insights ORDER BY created_at DESC LIMIT 10'),
      db.query('SELECT * FROM anomalies ORDER BY detected_at DESC LIMIT 10'),
      db.query('SELECT * FROM health_scores ORDER BY recorded_at DESC LIMIT 15')
    ]);
    const context = `Data Sources: ${JSON.stringify(sources.rows)}\nEvents: ${JSON.stringify(events.rows)}\nInsights: ${JSON.stringify(insights.rows)}\nAnomalies: ${JSON.stringify(anomalies.rows)}\nHealth Scores: ${JSON.stringify(health.rows)}`;
    const result = await callAI(
      `Question: ${question}\n\nCompany operational data:\n${context}`,
      'You are an AI assistant for a company intelligence platform. Answer questions about operational data with specific numbers, trends, and actionable recommendations. Be concise and data-driven. Format with **bold** for key metrics and bullet points for lists.'
    );
    res.json({ result });
  } catch (err) { handleErr(res, err); }
});

// Anomaly explanation
router.post('/anomaly-explanation', auth, async (req, res) => {
  try {
    const { anomaly_id, anomaly_description } = req.body;
    let anomalyData = anomaly_description || '';
    if (anomaly_id) {
      const r = await db.query('SELECT a.*, ds.name AS source_name FROM anomalies a LEFT JOIN data_sources ds ON a.source_id = ds.id WHERE a.id = $1', [anomaly_id]);
      if (r.rows[0]) anomalyData = JSON.stringify(r.rows[0]);
    }
    const recentEvents = await db.query('SELECT event_type, title, severity FROM events ORDER BY occurred_at DESC LIMIT 10');
    const result = await callAI(
      `Anomaly data: ${anomalyData}\nRecent context events: ${JSON.stringify(recentEvents.rows)}`,
      'You are an expert in company operations and data analysis. Explain detected anomalies in plain business language — what likely caused it, what the business impact is, and 3-5 specific recommended actions to investigate or resolve it. Format with ## sections for Cause, Impact, and Recommended Actions.'
    );
    res.json({ result });
  } catch (err) { handleErr(res, err); }
});

// Health analysis
router.post('/health-analysis', auth, async (req, res) => {
  try {
    const { department } = req.body;
    const healthData = await db.query(
      department
        ? 'SELECT * FROM health_scores WHERE department = $1 ORDER BY recorded_at DESC LIMIT 10'
        : 'SELECT * FROM health_scores ORDER BY recorded_at DESC LIMIT 20',
      department ? [department] : []
    );
    const anomalies = await db.query('SELECT metric_name, deviation_pct, severity FROM anomalies WHERE status = \'open\' ORDER BY detected_at DESC LIMIT 10');
    const result = await callAI(
      `Department: ${department || 'All departments'}\nHealth scores: ${JSON.stringify(healthData.rows)}\nActive anomalies: ${JSON.stringify(anomalies.rows)}`,
      'You are a company performance analyst. Analyze health scores across departments and provide: an overall assessment, identification of strengths and weaknesses, trend analysis, specific improvement recommendations, and risk flags. Format with ## headers for each section and use **bold** for key scores and findings.'
    );
    res.json({ result });
  } catch (err) { handleErr(res, err); }
});

// =============== NEW AI FEATURES ===============

// 1. Cross-source insight generator: synthesize patterns spanning multiple data sources
router.post('/cross-source-insight', auth, async (req, res) => {
  try {
    const { source_ids } = req.body;
    let sourcesQuery = 'SELECT * FROM data_sources';
    let params = [];
    if (Array.isArray(source_ids) && source_ids.length > 0) {
      sourcesQuery += ' WHERE id = ANY($1)';
      params = [source_ids];
    }
    const [sources, eventsBySource, anomaliesBySource] = await Promise.all([
      db.query(sourcesQuery, params),
      db.query('SELECT source_id, event_type, title, severity, occurred_at FROM events ORDER BY occurred_at DESC LIMIT 50'),
      db.query('SELECT source_id, metric_name, deviation_pct, severity FROM anomalies ORDER BY detected_at DESC LIMIT 30')
    ]);
    const context = `Selected Sources: ${JSON.stringify(sources.rows)}\nEvents (across sources): ${JSON.stringify(eventsBySource.rows)}\nAnomalies (across sources): ${JSON.stringify(anomaliesBySource.rows)}`;
    const result = await callAI(
      `Cross-source data context:\n${context}\n\nGenerate insights that ONLY become visible by correlating signals across these sources (do not produce single-source observations).`,
      'You are a cross-domain operations analyst. Identify connections, causal chains, and correlated patterns that span multiple data sources (e.g., a deployment event correlated with infrastructure anomaly correlated with CSAT drop). Format with ## Cross-Source Patterns, ## Likely Causal Chains, ## Recommended Investigations. Use **bold** for source names and key metrics.'
    );
    res.json({ result });
  } catch (err) { handleErr(res, err); }
});

// 2. Anomaly clustering: group related/similar anomalies and explain clusters
router.post('/anomaly-cluster', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const q = status
      ? 'SELECT a.*, ds.name AS source_name FROM anomalies a LEFT JOIN data_sources ds ON a.source_id = ds.id WHERE a.status = $1 ORDER BY a.detected_at DESC LIMIT 50'
      : 'SELECT a.*, ds.name AS source_name FROM anomalies a LEFT JOIN data_sources ds ON a.source_id = ds.id ORDER BY a.detected_at DESC LIMIT 50';
    const anomalies = await db.query(q, status ? [status] : []);
    const result = await callAI(
      `Anomalies to cluster:\n${JSON.stringify(anomalies.rows)}`,
      'You are an SRE-style anomaly analyst. Group these anomalies into 3-6 logical clusters by likely shared root cause, affected system, or business domain. For each cluster, give: a name (## Cluster: <name>), member anomalies as a bulleted list, a likely shared cause, and the recommended single mitigation that would address the whole cluster. Use **bold** for severity and metric names.'
    );
    res.json({ result });
  } catch (err) { handleErr(res, err); }
});

// 3. KPI forecaster: forecast a metric using recent health/anomaly data
router.post('/kpi-forecast', auth, async (req, res) => {
  try {
    const { metric, horizon } = req.body;
    if (!metric) return res.status(400).json({ error: 'metric is required' });
    const [health, anomalies, events] = await Promise.all([
      db.query('SELECT * FROM health_scores ORDER BY recorded_at DESC LIMIT 30'),
      db.query('SELECT metric_name, expected_value, actual_value, deviation_pct, detected_at FROM anomalies ORDER BY detected_at DESC LIMIT 30'),
      db.query('SELECT event_type, title, severity, occurred_at FROM events ORDER BY occurred_at DESC LIMIT 30')
    ]);
    const result = await callAI(
      `Metric to forecast: ${metric}\nHorizon: ${horizon || 'next 4 weeks'}\nHistorical health scores: ${JSON.stringify(health.rows)}\nRelated anomalies: ${JSON.stringify(anomalies.rows)}\nRecent events: ${JSON.stringify(events.rows)}`,
      'You are a quantitative business forecaster. Produce a forecast for the requested KPI with: ## Forecast (point estimate + range), ## Key Drivers, ## Risk Factors, ## Confidence (low/medium/high with reasoning). Use **bold** for numeric forecasts. Be explicit that this is heuristic, not statistical.'
    );
    res.json({ result });
  } catch (err) { handleErr(res, err); }
});

// 4. Weekly executive brief generator
router.post('/weekly-brief', auth, async (req, res) => {
  try {
    const [insights, events, anomalies, health] = await Promise.all([
      db.query("SELECT title, category, content, impact, action_required FROM insights WHERE created_at > NOW() - INTERVAL '14 days' ORDER BY created_at DESC LIMIT 20"),
      db.query("SELECT event_type, title, severity FROM events WHERE occurred_at > NOW() - INTERVAL '14 days' ORDER BY occurred_at DESC LIMIT 30"),
      db.query("SELECT metric_name, deviation_pct, severity, status FROM anomalies WHERE detected_at > NOW() - INTERVAL '14 days' ORDER BY detected_at DESC LIMIT 20"),
      db.query('SELECT department, overall_score, trend FROM health_scores ORDER BY recorded_at DESC LIMIT 20')
    ]);
    const result = await callAI(
      `Insights: ${JSON.stringify(insights.rows)}\nEvents: ${JSON.stringify(events.rows)}\nAnomalies: ${JSON.stringify(anomalies.rows)}\nHealth: ${JSON.stringify(health.rows)}`,
      'You are the chief of staff drafting a weekly executive brief. Produce: ## Top Wins, ## Top Risks, ## Decisions Needed This Week, ## Metrics to Watch, ## Recommended Actions. Be concise, bulleted, business-language only — no jargon. Use **bold** for headline numbers and decision items.'
    );
    res.json({ result });
  } catch (err) { handleErr(res, err); }
});

// 5. Query-result narrator: turn a query result set into an executive narrative
router.post('/query-narrate', auth, async (req, res) => {
  try {
    const { question, rows } = req.body;
    if (!Array.isArray(rows)) return res.status(400).json({ error: 'rows array is required' });
    const result = await callAI(
      `Original question: ${question || '(none)'}\nResult rows (JSON): ${JSON.stringify(rows).slice(0, 8000)}`,
      'You are a data storyteller. Turn the provided result rows into a clear executive narrative: ## Headline (1 sentence), ## What the data shows (3-5 bullets), ## So what (business implications), ## Recommended next questions. Use **bold** for key numbers.'
    );
    res.json({ result });
  } catch (err) { handleErr(res, err); }
});

module.exports = router;
