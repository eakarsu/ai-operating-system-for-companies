// Decision Replay — closed-loop retrospective over decision_log.
// Lets an operator scrub through every decision an agent or human made,
// see the evidence at decision time, the alternatives considered, and
// (via LLM) get a "what would I do differently now" narration.

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
        'X-Title': 'Decision Replay'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        temperature: 0.4,
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

router.get('/', async (req, res) => {
  try {
    const { actor, type, status_only } = req.query;
    const where = [];
    const args = [];
    if (actor) { args.push(`%${actor}%`); where.push(`actor ILIKE $${args.length}`); }
    if (type)  { args.push(type); where.push(`decision_type=$${args.length}`); }
    if (status_only === 'reversible') where.push(`reversible=true AND reverted_at IS NULL`);
    if (status_only === 'reverted')   where.push(`reverted_at IS NOT NULL`);

    const sql = `SELECT id, agent_run_id, workflow_run_id, decision_type, actor,
                        subject, rationale, evidence, alternatives_considered,
                        confidence_pct, reversible, reverted_at, human_approved,
                        created_at
                 FROM decision_log
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY created_at DESC LIMIT 200`;
    const r = await pool.query(sql, args);
    res.json({ decisions: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/stats', async (_req, res) => {
  try {
    const byType = await pool.query(`
      SELECT decision_type, COUNT(*) AS n,
             AVG(confidence_pct) AS avg_confidence,
             SUM(CASE WHEN human_approved THEN 1 ELSE 0 END) AS approved,
             SUM(CASE WHEN reverted_at IS NOT NULL THEN 1 ELSE 0 END) AS reverted
      FROM decision_log GROUP BY decision_type ORDER BY n DESC`);
    const byActor = await pool.query(`
      SELECT split_part(actor, ':', 1) AS actor_kind,
             split_part(actor, ':', 2) AS actor_name,
             COUNT(*) AS n
      FROM decision_log
      GROUP BY actor_kind, actor_name
      ORDER BY n DESC LIMIT 20`);
    const timeline = await pool.query(`
      SELECT DATE_TRUNC('day', created_at) AS day, COUNT(*) AS n
      FROM decision_log
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY day ORDER BY day`);
    res.json({ by_type: byType.rows, by_actor: byActor.rows, timeline: timeline.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const d = await pool.query('SELECT * FROM decision_log WHERE id=$1', [req.params.id]);
    if (!d.rows[0]) return res.status(404).json({ error: 'Not found' });
    const decision = d.rows[0];
    const context = { run: null, tool_calls: [], workflow_run: null, kpi_at_time: [] };

    if (decision.agent_run_id) {
      const run = await pool.query('SELECT * FROM agent_runs WHERE id=$1', [decision.agent_run_id]);
      context.run = run.rows[0] || null;
      const calls = await pool.query('SELECT * FROM agent_tool_calls WHERE agent_run_id=$1 ORDER BY call_order',
        [decision.agent_run_id]);
      context.tool_calls = calls.rows;
    }
    if (decision.workflow_run_id) {
      const wf = await pool.query('SELECT * FROM workflow_runs WHERE id=$1', [decision.workflow_run_id]);
      context.workflow_run = wf.rows[0] || null;
    }
    // KPI snapshots within 7 days of decision time — to show "what the agent saw"
    const kpiAtTime = await pool.query(`
      SELECT k.slug, k.name, ks.period, ks.value, ks.status
      FROM kpi_snapshots ks
      JOIN kpis k ON k.id=ks.kpi_id
      WHERE ks.recorded_at BETWEEN $1::timestamp - INTERVAL '14 days' AND $1::timestamp + INTERVAL '1 day'
      ORDER BY ks.recorded_at DESC LIMIT 20`, [decision.created_at]);
    context.kpi_at_time = kpiAtTime.rows;

    res.json({ decision, context });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/replay', async (req, res) => {
  try {
    const d = await pool.query('SELECT * FROM decision_log WHERE id=$1', [req.params.id]);
    if (!d.rows[0]) return res.status(404).json({ error: 'Not found' });
    const dec = d.rows[0];

    const sys = `You are an audit officer for an AI Operating System. Given a single past decision and its full evidence, write a structured retrospective:
- VERDICT (one of: justified, defensible, questionable, wrong)
- WHAT-WOULD-CHANGE-NOW: 1-3 bullets
- POLICY-DRIFT-FLAGS: any policy violations or guardrail issues
- LOOP-IMPROVEMENT: how to make the closed loop smarter next time
Be concise, no preamble.`;
    const usr = `DECISION
type: ${dec.decision_type}
actor: ${dec.actor}
subject: ${dec.subject}
rationale: ${dec.rationale}
confidence: ${dec.confidence_pct}%
reversible: ${dec.reversible}
human_approved: ${dec.human_approved}
evidence: ${JSON.stringify(dec.evidence)}
alternatives_considered: ${JSON.stringify(dec.alternatives_considered)}
created_at: ${dec.created_at}`;

    const llm = await callAI(sys, usr);
    const verdict = llm || `VERDICT: defensible
WHAT-WOULD-CHANGE-NOW:
- Add a precondition check before similar ${dec.decision_type} decisions.
- Capture more evidence rows (currently sparse).
POLICY-DRIFT-FLAGS:
${dec.reversible ? '- none' : '- irreversible action without explicit human approval (review)'}
LOOP-IMPROVEMENT:
- Feed outcome metric back into the planner prompt for similar future decisions.`;
    res.json({ decision_id: dec.id, retro: verdict, llm_used: !!llm });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/revert', async (req, res) => {
  try {
    const d = await pool.query('SELECT reversible, reverted_at FROM decision_log WHERE id=$1', [req.params.id]);
    if (!d.rows[0]) return res.status(404).json({ error: 'Not found' });
    if (!d.rows[0].reversible) return res.status(409).json({ error: 'Decision is not reversible' });
    if (d.rows[0].reverted_at) return res.status(409).json({ error: 'Already reverted' });
    const r = await pool.query(`UPDATE decision_log SET reverted_at=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id]);
    res.json({ decision: r.rows[0], reverted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
