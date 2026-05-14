const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Domain-realistic sample data generators for CompanyOS observability platform.
// Each handler inserts 5-10 rows into a single entity table and returns
// {inserted, entity}. Mounted at /api/admin -> POST /api/admin/sample-data/:entity.

const sources = [
  { name: 'Salesforce CRM', type: 'crm', connection_string: 'sfdc://prod.my.salesforce.com', sync_frequency: 'every_15_min', status: 'active', record_count: 184320, description: 'Primary CRM: accounts, opportunities, leads', owner: 'revops@companyos.ai', tags: 'crm,revenue,pipeline' },
  { name: 'Slack Workspace', type: 'communication', connection_string: 'slack://workspace/companyos', sync_frequency: 'real_time', status: 'active', record_count: 921045, description: 'Channel + DM event firehose', owner: 'platform@companyos.ai', tags: 'collaboration,messaging' },
  { name: 'AWS CloudWatch', type: 'infrastructure', connection_string: 'aws://us-east-1/cloudwatch', sync_frequency: 'every_15_min', status: 'active', record_count: 5832110, description: 'Metrics + alarms across prod accounts', owner: 'sre@companyos.ai', tags: 'infra,metrics,alerts' },
  { name: 'GitHub Enterprise', type: 'version_control', connection_string: 'https://github.com/companyos', sync_frequency: 'every_30_min', status: 'active', record_count: 41203, description: 'PRs, commits, deploy events', owner: 'eng-platform@companyos.ai', tags: 'engineering,velocity' },
  { name: 'Jira Cloud', type: 'project_management', connection_string: 'https://companyos.atlassian.net', sync_frequency: 'hourly', status: 'warning', record_count: 18432, description: 'Sprints, tickets, cycle time', owner: 'pmo@companyos.ai', tags: 'delivery,sprint' },
  { name: 'Stripe Payments', type: 'payments', connection_string: 'stripe://live', sync_frequency: 'real_time', status: 'active', record_count: 312445, description: 'Charges, subscriptions, MRR', owner: 'finance@companyos.ai', tags: 'finance,mrr,billing' },
  { name: 'Snowflake Warehouse', type: 'data_warehouse', connection_string: 'snowflake://companyos.us-east-1', sync_frequency: 'daily', status: 'active', record_count: 92840111, description: 'Modeled mart layer', owner: 'data@companyos.ai', tags: 'warehouse,analytics' },
  { name: 'Zendesk Support', type: 'customer_support', connection_string: 'https://companyos.zendesk.com', sync_frequency: 'every_15_min', status: 'active', record_count: 27433, description: 'Tickets, CSAT, agent activity', owner: 'support@companyos.ai', tags: 'support,csat' },
];

const events = [
  { event_type: 'deploy', title: 'Production deploy: payments-svc v2.18.0', description: 'Rolling deploy completed across 12 ECS tasks', severity: 'info', status: 'closed', payload: { service: 'payments-svc', version: '2.18.0', duration_s: 184 } },
  { event_type: 'kpi_change', title: 'MRR crossed $2.0M', description: 'Net new MRR up 4.1% week over week', severity: 'info', status: 'new', payload: { metric: 'mrr', value: 2014320, delta_pct: 4.1 } },
  { event_type: 'alarm', title: 'CloudWatch alarm: api-5xx-rate', description: '5xx rate spiked to 3.2% on api-gateway prod', severity: 'high', status: 'investigating', payload: { alarm: 'api-5xx-rate', threshold_pct: 1.0, observed_pct: 3.2 } },
  { event_type: 'deal_won', title: 'Closed-Won: Acme Corp - $148K ARR', description: 'Enterprise tier 12-month contract', severity: 'info', status: 'closed', payload: { account: 'Acme Corp', arr: 148000, owner: 'jordan.lee@companyos.ai' } },
  { event_type: 'churn_risk', title: 'Account health drop: Hooli Inc', description: 'Health score fell from 82 to 47 in 14 days', severity: 'high', status: 'new', payload: { account: 'Hooli Inc', score_before: 82, score_after: 47 } },
  { event_type: 'incident', title: 'P2 incident: Slack ingest backlog', description: 'Ingest lag reached 38 minutes; recovered in 22m', severity: 'medium', status: 'resolved', payload: { service: 'slack-ingest', max_lag_s: 2280 } },
  { event_type: 'release', title: 'Feature flag enabled: ai_weekly_brief', description: '100% rollout to enterprise tier', severity: 'info', status: 'closed', payload: { flag: 'ai_weekly_brief', rollout_pct: 100 } },
  { event_type: 'security', title: 'Failed login burst from 51.x.x.x', description: '47 failed logins in 90 seconds; IP blocked', severity: 'high', status: 'closed', payload: { ip: '51.140.22.18', count: 47 } },
];

const insights = [
  { title: 'Engineering velocity down 12% in Q-to-date', category: 'engineering', content: 'PR cycle time rose from 18h to 24h; correlated with on-call burden on platform team.', confidence_score: 0.84, impact: 'high', action_required: true, assigned_to: 'eng-leads@companyos.ai', status: 'new', tags: 'velocity,engineering' },
  { title: 'Pipeline coverage healthy for Q3', category: 'revenue', content: '3.4x coverage on commit number with strong late-stage weighting.', confidence_score: 0.91, impact: 'medium', action_required: false, assigned_to: 'cro@companyos.ai', status: 'new', tags: 'revenue,pipeline' },
  { title: 'Support backlog shifting to enterprise tier', category: 'support', content: 'Enterprise share of open tickets up from 31% to 48% MoM; implies under-staffed enterprise pod.', confidence_score: 0.78, impact: 'high', action_required: true, assigned_to: 'support-lead@companyos.ai', status: 'new', tags: 'support,staffing' },
  { title: 'Infra cost trending +8% MoM driven by Snowflake', category: 'finance', content: 'Warehouse compute on the analytics_xl warehouse is the top driver; recommend right-sizing.', confidence_score: 0.88, impact: 'medium', action_required: true, assigned_to: 'finops@companyos.ai', status: 'new', tags: 'finops,snowflake' },
  { title: 'Top 5 accounts contribute 41% of MRR', category: 'revenue', content: 'Concentration risk above target threshold of 35%.', confidence_score: 0.95, impact: 'high', action_required: true, assigned_to: 'cfo@companyos.ai', status: 'new', tags: 'revenue,concentration' },
  { title: 'Deploy frequency up 22% since release of CI v3', category: 'engineering', content: 'Median deploys/day rose from 9 to 11; failure rate flat.', confidence_score: 0.82, impact: 'medium', action_required: false, assigned_to: 'eng-platform@companyos.ai', status: 'reviewed', tags: 'devops,velocity' },
  { title: 'NPS dipped 6 points among SMB cohort', category: 'product', content: 'Free-text themes: "billing surprises" and "slow support response".', confidence_score: 0.76, impact: 'medium', action_required: true, assigned_to: 'product@companyos.ai', status: 'new', tags: 'nps,smb' },
];

const anomalies = [
  { metric_name: 'api.request.latency_p95_ms', expected_value: 220, actual_value: 612, deviation_pct: 178.2, severity: 'high', description: 'p95 latency tripled on /v1/insights for 18 minutes', status: 'open' },
  { metric_name: 'mrr.daily_net_new', expected_value: 6200, actual_value: 1850, deviation_pct: -70.2, severity: 'high', description: 'Daily net new MRR collapsed; suspected billing webhook outage', status: 'investigating' },
  { metric_name: 'slack.ingest.lag_seconds', expected_value: 5, actual_value: 2280, deviation_pct: 45500, severity: 'medium', description: 'Ingest lag spiked during Kafka rebalance', status: 'resolved' },
  { metric_name: 'support.tickets.open_count', expected_value: 142, actual_value: 318, deviation_pct: 123.9, severity: 'high', description: 'Backlog doubled after enterprise outage', status: 'open' },
  { metric_name: 'github.pr.cycle_time_hours', expected_value: 18, actual_value: 31, deviation_pct: 72.2, severity: 'medium', description: 'PR cycle time spike across platform team', status: 'open' },
  { metric_name: 'stripe.charge.failure_rate_pct', expected_value: 1.1, actual_value: 4.7, deviation_pct: 327.3, severity: 'high', description: '3DS challenge failures up; processor degraded', status: 'investigating' },
  { metric_name: 'snowflake.credits.daily', expected_value: 480, actual_value: 821, deviation_pct: 71.0, severity: 'medium', description: 'Unexpected analytics_xl warehouse run from BI scheduler', status: 'open' },
];

const healthScores = [
  { department: 'Engineering', overall_score: 78, productivity_score: 80, velocity_score: 72, quality_score: 84, collaboration_score: 76, trend: 'declining', notes: 'On-call load up; PR cycle time degraded.', period: 'weekly' },
  { department: 'Sales', overall_score: 86, productivity_score: 88, velocity_score: 84, quality_score: 82, collaboration_score: 90, trend: 'improving', notes: 'Pipeline coverage strong; ramp on plan.', period: 'weekly' },
  { department: 'Customer Support', overall_score: 64, productivity_score: 70, velocity_score: 58, quality_score: 66, collaboration_score: 72, trend: 'declining', notes: 'Backlog growing in enterprise tier.', period: 'weekly' },
  { department: 'Marketing', overall_score: 82, productivity_score: 84, velocity_score: 80, quality_score: 78, collaboration_score: 86, trend: 'stable', notes: 'Campaign throughput steady.', period: 'weekly' },
  { department: 'Finance', overall_score: 89, productivity_score: 90, velocity_score: 86, quality_score: 92, collaboration_score: 88, trend: 'stable', notes: 'Close cycle on schedule.', period: 'monthly' },
  { department: 'Product', overall_score: 80, productivity_score: 78, velocity_score: 82, quality_score: 80, collaboration_score: 84, trend: 'improving', notes: 'Discovery throughput up.', period: 'weekly' },
];

const queries = [
  { name: 'Top 10 accounts by ARR', query_text: 'SELECT account, sum(arr) FROM revenue.accounts GROUP BY 1 ORDER BY 2 DESC LIMIT 10', query_type: 'sql', result_summary: 'Concentration in top 5 = 41%', tags: 'revenue,arr', is_scheduled: true, schedule_frequency: 'weekly', run_count: 24 },
  { name: 'Why did MRR drop yesterday?', query_text: 'why did mrr drop yesterday', query_type: 'natural_language', result_summary: 'Stripe webhook outage, recovered after 2h', tags: 'mrr,incident', is_scheduled: false, run_count: 3 },
  { name: 'Open P1/P2 incidents this week', query_text: 'show me all open p1 and p2 incidents in the last 7 days', query_type: 'natural_language', result_summary: '4 open incidents, 2 in payments domain', tags: 'incidents', is_scheduled: true, schedule_frequency: 'daily', run_count: 41 },
  { name: 'PR cycle time by team', query_text: 'SELECT team, avg(cycle_time_hours) FROM eng.pr_metrics GROUP BY 1', query_type: 'sql', result_summary: 'Platform team highest at 31h', tags: 'engineering,velocity', is_scheduled: true, schedule_frequency: 'weekly', run_count: 11 },
  { name: 'Churn risk accounts', query_text: 'which enterprise accounts have a health score drop > 20 in last 14 days', query_type: 'natural_language', result_summary: '3 accounts flagged: Hooli, Initech, Massive Dynamic', tags: 'churn,health', is_scheduled: false, run_count: 6 },
  { name: 'Snowflake credit burn by warehouse', query_text: 'SELECT warehouse_name, sum(credits_used) FROM snowflake.account_usage.warehouse_metering_history WHERE start_time > current_date - 7 GROUP BY 1', query_type: 'sql', result_summary: 'analytics_xl is 62% of spend', tags: 'finops,snowflake', is_scheduled: true, schedule_frequency: 'daily', run_count: 30 },
];

async function insertSources(req) {
  const picked = pickN(sources, 5, 8);
  let count = 0;
  for (const s of picked) {
    await db.query(
      `INSERT INTO data_sources (name, type, connection_string, sync_frequency, status, last_synced_at, record_count, description, owner, tags)
       VALUES ($1,$2,$3,$4,$5, NOW() - ($6 || ' minutes')::interval, $7,$8,$9,$10)`,
      [s.name, s.type, s.connection_string, s.sync_frequency, s.status, String(Math.floor(Math.random()*240)), s.record_count, s.description, s.owner, s.tags]
    );
    count++;
  }
  return count;
}

async function insertEvents(req) {
  const picked = pickN(events, 5, 8);
  let count = 0;
  // Get a real source id if available, else null
  let sourceId = null;
  try { const r = await db.query('SELECT id FROM data_sources ORDER BY id LIMIT 1'); sourceId = r.rows[0]?.id || null; } catch { /* ignore */ }
  for (const e of picked) {
    await db.query(
      `INSERT INTO events (source_id, event_type, title, description, payload, severity, status, occurred_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7, NOW() - ($8 || ' minutes')::interval)`,
      [sourceId, e.event_type, e.title, e.description, e.payload, e.severity, e.status, String(Math.floor(Math.random()*1440))]
    );
    count++;
  }
  return count;
}

async function insertInsights(req) {
  const picked = pickN(insights, 5, 7);
  let count = 0;
  for (const i of picked) {
    await db.query(
      `INSERT INTO insights (title, category, content, confidence_score, impact, action_required, assigned_to, status, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [i.title, i.category, i.content, i.confidence_score, i.impact, i.action_required, i.assigned_to, i.status, i.tags]
    );
    count++;
  }
  return count;
}

async function insertAnomalies(req) {
  const picked = pickN(anomalies, 5, 7);
  let count = 0;
  let sourceId = null;
  try { const r = await db.query('SELECT id FROM data_sources ORDER BY id LIMIT 1'); sourceId = r.rows[0]?.id || null; } catch { /* ignore */ }
  for (const a of picked) {
    await db.query(
      `INSERT INTO anomalies (source_id, metric_name, expected_value, actual_value, deviation_pct, severity, description, status, detected_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW() - ($9 || ' hours')::interval)`,
      [sourceId, a.metric_name, a.expected_value, a.actual_value, a.deviation_pct, a.severity, a.description, a.status, String(Math.floor(Math.random()*72))]
    );
    count++;
  }
  return count;
}

async function insertHealth(req) {
  const picked = pickN(healthScores, 5, 6);
  let count = 0;
  for (const h of picked) {
    await db.query(
      `INSERT INTO health_scores (department, overall_score, productivity_score, velocity_score, quality_score, collaboration_score, trend, notes, period)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [h.department, h.overall_score, h.productivity_score, h.velocity_score, h.quality_score, h.collaboration_score, h.trend, h.notes, h.period]
    );
    count++;
  }
  return count;
}

async function insertQueries(req) {
  const picked = pickN(queries, 5, 6);
  let count = 0;
  for (const q of picked) {
    await db.query(
      `INSERT INTO saved_queries (name, query_text, query_type, result_summary, tags, is_scheduled, schedule_frequency, run_count, last_run_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW() - ($9 || ' hours')::interval)`,
      [q.name, q.query_text, q.query_type, q.result_summary, q.tags, q.is_scheduled, q.schedule_frequency || null, q.run_count, String(Math.floor(Math.random()*48))]
    );
    count++;
  }
  return count;
}

function pickN(arr, min, max) {
  const n = Math.min(arr.length, min + Math.floor(Math.random() * (max - min + 1)));
  // Shuffle copy
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

const handlers = {
  sources: insertSources,
  events: insertEvents,
  insights: insertInsights,
  anomalies: insertAnomalies,
  health: insertHealth,
  queries: insertQueries,
};

router.post('/sample-data/:entity', auth, async (req, res) => {
  const entity = req.params.entity;
  const handler = handlers[entity];
  if (!handler) return res.status(400).json({ error: `Unknown entity: ${entity}. Valid: ${Object.keys(handlers).join(', ')}` });
  try {
    const inserted = await handler(req);
    res.json({ inserted, entity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
