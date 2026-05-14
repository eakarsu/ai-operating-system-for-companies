// Spec Generator — closed-loop spec authoring.
// Given an anomaly or insight, generate an agent-executable spec (the
// description-promised "specs agents can execute on") complete with
// acceptance criteria, target KPI, and a default assignee suggestion.

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

async function callAI(systemPrompt, userPrompt) {
  if (!process.env.OPENROUTER_API_KEY) return null;
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'Spec Generator'
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

// Heuristic mapping: signal type/title -> {kpi, dept, priority}
function classifySignal(text) {
  const t = (text || '').toLowerCase();
  if (/(churn|nrr|retention)/.test(t))     return { kpi: 'nrr', dept: 'cs', priority: 'high' };
  if (/(cac|paid|attribution|leads?)/.test(t)) return { kpi: 'cac', dept: 'marketing', priority: 'high' };
  if (/(burn|runway|cost|aws|infra)/.test(t))  return { kpi: 'burn_multiple', dept: 'finance', priority: 'critical' };
  if (/(outage|incident|5xx|mttr|sev)/.test(t)) return { kpi: 'mttr', dept: 'engineering', priority: 'critical' };
  if (/(csat|support|ticket)/.test(t))     return { kpi: 'csat', dept: 'support', priority: 'high' };
  if (/(velocity|pr|review|sprint)/.test(t))   return { kpi: 'mttr', dept: 'engineering', priority: 'medium' };
  if (/(win.?rate|pipeline|opp)/.test(t))      return { kpi: 'win_rate', dept: 'sales', priority: 'high' };
  if (/(hiring|attrition|recruit|fill)/.test(t)) return { kpi: 'time_to_fill', dept: 'hr', priority: 'medium' };
  return { kpi: null, dept: 'ops', priority: 'medium' };
}

router.post('/generate', async (req, res) => {
  try {
    const { source_type, source_id, freeform } = req.body || {};
    let signal = null;

    if (source_type === 'anomaly' && source_id) {
      const r = await pool.query('SELECT * FROM anomalies WHERE id=$1', [source_id]);
      if (r.rows[0]) signal = {
        kind: 'anomaly', title: `${r.rows[0].metric_name} deviated ${r.rows[0].deviation_pct}%`,
        description: r.rows[0].description, severity: r.rows[0].severity,
        body: r.rows[0]
      };
    } else if (source_type === 'insight' && source_id) {
      const r = await pool.query('SELECT * FROM insights WHERE id=$1', [source_id]);
      if (r.rows[0]) signal = {
        kind: 'insight', title: r.rows[0].title,
        description: r.rows[0].content, severity: r.rows[0].impact,
        body: r.rows[0]
      };
    } else if (freeform) {
      signal = { kind: 'manual', title: freeform.slice(0, 120), description: freeform, severity: 'medium' };
    }
    if (!signal) return res.status(400).json({ error: 'Provide source_type+source_id or freeform' });

    const cls = classifySignal(`${signal.title} ${signal.description || ''}`);
    const deptRow = await pool.query('SELECT name, head_email FROM departments WHERE slug=$1', [cls.dept]);
    const kpiRow = cls.kpi ? await pool.query(
      `SELECT k.slug, k.name, k.unit, k.target_value, k.good_direction,
              (SELECT value FROM kpi_snapshots WHERE kpi_id=k.id ORDER BY recorded_at DESC LIMIT 1) AS current_value
       FROM kpis k WHERE k.slug=$1`, [cls.kpi]) : { rows: [] };

    const sys = `You are a senior product/engineering operator. Given a signal
(anomaly, insight, or manual), write an agent-executable spec.
Output STRICT JSON with the schema:
{"title": "...", "spec_markdown": "...", "acceptance_criteria":["...","..."],
 "assignee_suggestion":"agent:<slug>" or "human:<role>@",
 "priority":"low|medium|high|critical",
 "target_kpi":"<slug or null>",
 "expected_uplift":"...",
 "tool_calls":[{"tool":"<slug>","args":{...}},...]}
Tool calls must be MCP-style and use known tool slugs:
 sfdc.query_opportunity, sfdc.update_stage, hubspot.search_contacts,
 quickbooks.create_invoice, netsuite.lookup_customer, slack.post_message,
 gmail.draft_reply, linear.create_issue, github.open_pr, stripe.refund,
 intercom.tag_user, zendesk.create_ticket.
Markdown spec should be ready to paste into Linear/Jira.`;
    const usr = `SIGNAL
kind: ${signal.kind}
title: ${signal.title}
severity: ${signal.severity}
description: ${signal.description || ''}

CLASSIFIED DEPARTMENT: ${cls.dept} (${deptRow.rows[0]?.name || ''}, head ${deptRow.rows[0]?.head_email || 'unknown'})
TARGET KPI: ${cls.kpi || 'none'} (current=${kpiRow.rows[0]?.current_value || '?'}, target=${kpiRow.rows[0]?.target_value || '?'} ${kpiRow.rows[0]?.unit || ''})

Write the spec.`;

    let spec = null;
    let llmUsed = false;
    const raw = await callAI(sys, usr);
    if (raw) {
      llmUsed = true;
      try { const m = raw.match(/\{[\s\S]*\}/); if (m) spec = JSON.parse(m[0]); } catch (e) { spec = null; }
    }
    if (!spec) {
      // Deterministic fallback
      spec = {
        title: signal.title.slice(0, 120),
        spec_markdown: `## Context\n${signal.description || ''}\n\n## Goal\nMove ${cls.kpi || 'KPI'} toward target.\n\n## Steps\n1. Investigate root cause via ${cls.dept} dashboards.\n2. Run a 7-day mitigation pilot.\n3. Measure outcome vs baseline.\n\n## Acceptance\n- Mitigation deployed.\n- Outcome metric improves at least 5% in 14 days.`,
        acceptance_criteria: [
          'Mitigation deployed to production.',
          'KPI baseline captured before change.',
          'Outcome measured within 14 days.'
        ],
        assignee_suggestion: deptRow.rows[0]?.head_email
          ? `human:${deptRow.rows[0].head_email}`
          : 'agent:planner',
        priority: cls.priority,
        target_kpi: cls.kpi,
        expected_uplift: cls.kpi ? `Move ${cls.kpi} 5-10% toward target in 30 days` : 'Qualitative',
        tool_calls: [
          { tool: 'linear.create_issue', args: { team: cls.dept.toUpperCase().slice(0, 6), title: signal.title.slice(0, 120) } },
          { tool: 'slack.post_message',  args: { channel: `#${cls.dept}`, text: `New spec generated for: ${signal.title}` } }
        ]
      };
    }

    // Persist as a closed-loop ticket so it shows up in the queue.
    const baseline = kpiRow.rows[0]?.current_value || null;
    const ins = await pool.query(`INSERT INTO closed_loop_tickets
      (source_type, source_id, title, spec, assignee, status, priority, loop_closed_kpi, baseline_value)
      VALUES ($1,$2,$3,$4,$5,'open',$6,$7,$8) RETURNING id`,
      [signal.kind, source_id || null, spec.title,
       typeof spec.spec_markdown === 'string' ? spec.spec_markdown : JSON.stringify(spec),
       spec.assignee_suggestion, spec.priority, spec.target_kpi, baseline]);

    res.json({ spec, ticket_id: ins.rows[0].id, llm_used: llmUsed,
      target_kpi: kpiRow.rows[0] || null, department: deptRow.rows[0] || null });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/recent', async (_req, res) => {
  try {
    const r = await pool.query(`SELECT id, title, priority, status, loop_closed_kpi, created_at
      FROM closed_loop_tickets ORDER BY created_at DESC LIMIT 25`);
    res.json({ recent: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
