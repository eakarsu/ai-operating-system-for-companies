// Org-wide Intent Graph — "who said what, why, and what shipped"
// Builds a graph over departments, decisions, agent_runs, workflow_runs,
// and tickets that lets the operator trace any outcome back to the
// intent + evidence that produced it.

const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
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
        'X-Title': 'Intent Graph'
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

router.get('/departments', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT d.id, d.slug, d.name, d.head_email, d.headcount, d.charter,
             d.primary_kpis, d.upstream_deps, d.downstream_deps
      FROM departments d ORDER BY d.slug`);
    res.json({ departments: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Build the multi-layer graph: department -> workflow -> agent_run -> decision -> ticket
router.get('/graph', async (_req, res) => {
  try {
    const nodes = [];
    const edges = [];

    const deps = await pool.query('SELECT id, slug, name, primary_kpis, upstream_deps, downstream_deps FROM departments');
    for (const d of deps.rows) {
      nodes.push({ id: `dept:${d.slug}`, kind: 'department', label: d.name, kpis: d.primary_kpis });
      (d.downstream_deps || '').split(',').filter(Boolean).forEach(ds => {
        edges.push({ from: `dept:${d.slug}`, to: `dept:${ds.trim()}`, kind: 'feeds_into' });
      });
    }

    const wf = await pool.query(`SELECT w.id, w.slug, w.name, w.departments FROM workflows w WHERE w.active=true`);
    for (const w of wf.rows) {
      nodes.push({ id: `wf:${w.slug}`, kind: 'workflow', label: w.name });
      (w.departments || '').split(',').filter(Boolean).forEach(ds => {
        edges.push({ from: `dept:${ds.trim()}`, to: `wf:${w.slug}`, kind: 'owns' });
      });
    }

    const wfr = await pool.query(`SELECT wr.id, wr.subject, wr.status, wr.amount_usd,
        w.slug AS wf_slug FROM workflow_runs wr JOIN workflows w ON w.id=wr.workflow_id
        ORDER BY wr.started_at DESC LIMIT 12`);
    for (const r of wfr.rows) {
      nodes.push({ id: `run:${r.id}`, kind: 'workflow_run', label: r.subject, status: r.status, amount: r.amount_usd });
      edges.push({ from: `wf:${r.wf_slug}`, to: `run:${r.id}`, kind: 'spawned' });
    }

    const dec = await pool.query(`SELECT id, decision_type, actor, subject, workflow_run_id
      FROM decision_log ORDER BY created_at DESC LIMIT 40`);
    for (const d of dec.rows) {
      nodes.push({ id: `dec:${d.id}`, kind: 'decision', label: d.subject, actor: d.actor, type: d.decision_type });
      if (d.workflow_run_id) edges.push({ from: `run:${d.workflow_run_id}`, to: `dec:${d.id}`, kind: 'decided' });
    }

    const tix = await pool.query(`SELECT id, title, status, loop_closed_kpi, source_type, source_id
      FROM closed_loop_tickets ORDER BY created_at DESC LIMIT 30`);
    for (const t of tix.rows) {
      nodes.push({ id: `tic:${t.id}`, kind: 'ticket', label: t.title, status: t.status, kpi: t.loop_closed_kpi });
    }

    res.json({ nodes, edges, counts: {
      departments: deps.rows.length, workflows: wf.rows.length,
      workflow_runs: wfr.rows.length, decisions: dec.rows.length, tickets: tix.rows.length
    }});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Trace any node back to root intent
router.get('/trace/:kind/:id', async (req, res) => {
  try {
    const { kind, id } = req.params;
    const chain = [];

    if (kind === 'ticket') {
      const t = await pool.query('SELECT * FROM closed_loop_tickets WHERE id=$1', [id]);
      if (!t.rows[0]) return res.status(404).json({ error: 'Not found' });
      chain.push({ kind: 'ticket', data: t.rows[0] });

      if (t.rows[0].source_type === 'anomaly' && t.rows[0].source_id) {
        const a = await pool.query('SELECT * FROM anomalies WHERE id=$1', [t.rows[0].source_id]);
        if (a.rows[0]) chain.push({ kind: 'anomaly', data: a.rows[0] });
      } else if (t.rows[0].source_type === 'insight' && t.rows[0].source_id) {
        const i = await pool.query('SELECT * FROM insights WHERE id=$1', [t.rows[0].source_id]);
        if (i.rows[0]) chain.push({ kind: 'insight', data: i.rows[0] });
      }

      if (t.rows[0].loop_closed_kpi) {
        const k = await pool.query('SELECT * FROM kpis WHERE slug=$1', [t.rows[0].loop_closed_kpi]);
        if (k.rows[0]) chain.push({ kind: 'kpi', data: k.rows[0] });
      }
    } else if (kind === 'decision') {
      const d = await pool.query('SELECT * FROM decision_log WHERE id=$1', [id]);
      if (!d.rows[0]) return res.status(404).json({ error: 'Not found' });
      chain.push({ kind: 'decision', data: d.rows[0] });
      if (d.rows[0].agent_run_id) {
        const r = await pool.query('SELECT * FROM agent_runs WHERE id=$1', [d.rows[0].agent_run_id]);
        if (r.rows[0]) chain.push({ kind: 'agent_run', data: r.rows[0] });
      }
      if (d.rows[0].workflow_run_id) {
        const w = await pool.query('SELECT * FROM workflow_runs WHERE id=$1', [d.rows[0].workflow_run_id]);
        if (w.rows[0]) chain.push({ kind: 'workflow_run', data: w.rows[0] });
      }
    } else if (kind === 'agent_run') {
      const r = await pool.query('SELECT * FROM agent_runs WHERE id=$1', [id]);
      if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
      chain.push({ kind: 'agent_run', data: r.rows[0] });
      const decs = await pool.query('SELECT * FROM decision_log WHERE agent_run_id=$1', [id]);
      chain.push({ kind: 'decisions', data: decs.rows });
      const calls = await pool.query('SELECT * FROM agent_tool_calls WHERE agent_run_id=$1 ORDER BY call_order', [id]);
      chain.push({ kind: 'tool_calls', data: calls.rows });
    } else {
      return res.status(400).json({ error: 'kind must be ticket|decision|agent_run' });
    }

    res.json({ chain });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/narrate', async (req, res) => {
  try {
    const { kind, id } = req.body || {};
    if (!kind || !id) return res.status(400).json({ error: 'kind and id required' });
    // Inline call to /trace logic
    let chain = [];
    if (kind === 'ticket') {
      const t = await pool.query('SELECT * FROM closed_loop_tickets WHERE id=$1', [id]);
      if (t.rows[0]) chain.push({ kind: 'ticket', data: t.rows[0] });
    } else if (kind === 'decision') {
      const d = await pool.query('SELECT * FROM decision_log WHERE id=$1', [id]);
      if (d.rows[0]) chain.push({ kind: 'decision', data: d.rows[0] });
    }
    const sys = `You are the AI Operating System narrator. Given a decision/ticket chain, produce a one-paragraph narrative answering: WHO decided WHAT, on WHAT evidence, WHY, and WHAT SHIPPED. End with one risk callout.`;
    const llm = await callAI(sys, `CHAIN: ${JSON.stringify(chain, null, 2)}`);
    res.json({ narration: llm || 'No LLM available; narration skipped.', llm_used: !!llm });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
