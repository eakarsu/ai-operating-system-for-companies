// Agent Task Dispatcher — planner-agent + MCP-style function calling.
// Given a company-level goal, the planner agent decomposes it into ordered
// tool calls from the agent_tools catalog, routes them to the right executor
// agent, and persists the run + tool calls for traceability.

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

const SYSTEM_PROMPT = `You are the Planner Agent in an AI Operating System for a company.
You decompose a high-level goal into an ordered plan of tool calls.
You MUST output STRICT JSON with the schema:
{"plan":[{"step":1,"agent":"<agent_slug>","tool":"<tool_slug>","args":{...},"why":"..."}],
 "rationale":"...","risk":"low|medium|high"}
Only use agents and tools listed in CATALOG. Prefer read-only tools first.
Mark side_effect=write or irreversible steps as requiring human approval by
adding "approval":true. No prose outside the JSON.`;

async function callPlanner(systemPrompt, userPrompt) {
  if (!process.env.OPENROUTER_API_KEY) return null;
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'Agent Task Dispatcher'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) {
    return null;
  }
}

function staticPlan(goal, agents, tools) {
  const g = goal.toLowerCase();
  const has = (slug) => tools.find(t => t.slug === slug);
  const agentFor = (dept) => agents.find(a => a.department === dept)?.slug || 'planner';

  if (g.includes('renew') || g.includes('opportunity') || g.includes('quote')) {
    return {
      plan: [
        { step: 1, agent: agentFor('sales'), tool: 'sfdc.query_opportunity', args: { filter: 'StageName=Proposal' }, why: 'Pull current state of the opp.', approval: false },
        { step: 2, agent: agentFor('marketing'), tool: 'hubspot.search_contacts', args: { q: 'champion=true' }, why: 'Identify multi-thread champions.', approval: false },
        { step: 3, agent: agentFor('sales'), tool: 'gmail.draft_reply', args: { body: 'Drafted follow-up' }, why: 'Move thread forward.', approval: true },
        { step: 4, agent: agentFor('sales'), tool: 'sfdc.update_stage', args: { stage: 'Closed Won' }, why: 'Advance after signature.', approval: true }
      ].filter(s => has(s.tool)),
      rationale: 'Deterministic fallback: sales-renewal playbook applied.',
      risk: 'medium'
    };
  }
  if (g.includes('outage') || g.includes('incident') || g.includes('rollback')) {
    return {
      plan: [
        { step: 1, agent: agentFor('engineering'), tool: 'slack.post_message', args: { channel: '#oncall', text: 'Incident detected, investigating.' }, why: 'Notify oncall.', approval: false },
        { step: 2, agent: agentFor('engineering'), tool: 'github.open_pr', args: { repo: 'acme/payments', head: 'hotfix/rollback', base: 'main', title: 'Roll back to last green' }, why: 'Rollback to last known good.', approval: true },
        { step: 3, agent: agentFor('engineering'), tool: 'linear.create_issue', args: { team: 'INFRA', title: 'Postmortem' }, why: 'Track postmortem.', approval: false }
      ].filter(s => has(s.tool)),
      rationale: 'Incident response playbook (detect-page-rollback-postmortem).',
      risk: 'high'
    };
  }
  if (g.includes('invoice') || g.includes('cash') || g.includes('ar')) {
    return {
      plan: [
        { step: 1, agent: agentFor('finance'), tool: 'netsuite.lookup_customer', args: { saved_search: 'AR_Aging' }, why: 'Surface aging buckets.', approval: false },
        { step: 2, agent: agentFor('finance'), tool: 'quickbooks.create_invoice', args: { net: 30 }, why: 'Generate invoice.', approval: true },
        { step: 3, agent: agentFor('finance'), tool: 'slack.post_message', args: { channel: '#finance' }, why: 'Notify ops.', approval: false }
      ].filter(s => has(s.tool)),
      rationale: 'Finance AR playbook.',
      risk: 'medium'
    };
  }
  return {
    plan: [
      { step: 1, agent: 'planner', tool: 'sfdc.query_opportunity', args: {}, why: 'Read state.', approval: false }
    ].filter(s => has(s.tool)),
    rationale: 'Generic fallback (no playbook matched).',
    risk: 'low'
  };
}

router.get('/catalog', async (_req, res) => {
  try {
    const a = await pool.query('SELECT slug,name,role,department,tool_slugs FROM agents WHERE active=true ORDER BY slug');
    const t = await pool.query('SELECT slug,name,connector_vendor,side_effect,approval_required FROM agent_tools ORDER BY slug');
    res.json({ agents: a.rows, tools: t.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/dispatch', async (req, res) => {
  try {
    const { goal, workflow_run_id, dry_run = false } = req.body || {};
    if (!goal) return res.status(400).json({ error: 'goal required' });

    const [agents, tools] = await Promise.all([
      pool.query('SELECT slug,name,role,department,tool_slugs FROM agents WHERE active=true').then(r => r.rows),
      pool.query('SELECT slug,name,connector_vendor,side_effect,approval_required FROM agent_tools').then(r => r.rows)
    ]);

    const usr = `GOAL: ${goal}
WORKFLOW_RUN_ID: ${workflow_run_id || 'none'}

CATALOG (agents):
${agents.map(a => `- ${a.slug} (${a.role}, dept=${a.department}) tools=${a.tool_slugs || ''}`).join('\n')}

CATALOG (tools):
${tools.map(t => `- ${t.slug} via ${t.connector_vendor} [${t.side_effect}${t.approval_required ? ', approval' : ''}]`).join('\n')}

Decompose GOAL into an ordered plan. Output JSON only.`;

    let plan = null;
    let llmUsed = false;
    const raw = await callPlanner(SYSTEM_PROMPT, usr);
    if (raw) {
      llmUsed = true;
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) plan = JSON.parse(jsonMatch[0]);
      } catch (e) { plan = null; }
    }
    if (!plan || !Array.isArray(plan.plan)) plan = staticPlan(goal, agents, tools);

    // Filter to valid tool slugs only.
    const toolMap = new Map(tools.map(t => [t.slug, t]));
    plan.plan = (plan.plan || []).filter(s => toolMap.has(s.tool));

    if (dry_run) return res.json({ goal, plan, llm_used: llmUsed, dispatched: false });

    // Persist as agent_run + tool calls (simulated execution).
    const planner = agents.find(a => a.slug === 'planner');
    const runIns = await pool.query(`INSERT INTO agent_runs
      (agent_id, workflow_run_id, goal, plan, status, steps_planned, started_at)
      VALUES ((SELECT id FROM agents WHERE slug='planner'), $1, $2, $3, 'running', $4, NOW())
      RETURNING id`, [workflow_run_id || null, goal, JSON.stringify(plan), plan.plan.length]);
    const runId = runIns.rows[0].id;

    let completed = 0;
    for (const step of plan.plan) {
      const tool = toolMap.get(step.tool);
      const needsApproval = tool?.approval_required || step.approval === true;
      const status = needsApproval ? 'ok' : 'ok';      // simulated success
      const result = needsApproval
        ? { simulated: true, note: 'queued for human approval' }
        : { simulated: true, note: 'executed (read-only)' };
      await pool.query(`INSERT INTO agent_tool_calls
        (agent_run_id, tool_slug, call_order, args, result, status, latency_ms)
        VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [runId, step.tool, step.step || 1, JSON.stringify(step.args || {}),
         JSON.stringify(result), status, 200 + Math.floor(Math.random() * 1800)]);

      // Decision log
      await pool.query(`INSERT INTO decision_log
        (agent_run_id, workflow_run_id, decision_type, actor, subject, rationale, evidence, confidence_pct, reversible, human_approved)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [runId, workflow_run_id || null, 'tool_dispatch',
         `agent:${step.agent || 'planner'}`,
         `${step.tool} call`,
         step.why || plan.rationale,
         JSON.stringify({ args: step.args, plan_step: step.step }),
         85, tool?.side_effect !== 'irreversible', needsApproval ? null : true]);
      completed++;
    }

    await pool.query(`UPDATE agent_runs SET status='succeeded', steps_completed=$2, finished_at=NOW(),
        outcome='Plan executed (simulated; approvals queued where needed).'
        WHERE id=$1`, [runId, completed]);

    res.json({ goal, plan, llm_used: llmUsed, dispatched: true, agent_run_id: runId, steps_executed: completed });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/runs', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT ar.id, ar.goal, ar.status, ar.steps_planned, ar.steps_completed,
             ar.tokens_in, ar.tokens_out, ar.cost_cents, ar.started_at, ar.finished_at,
             ar.outcome, a.slug AS agent_slug, a.name AS agent_name
      FROM agent_runs ar
      LEFT JOIN agents a ON a.id = ar.agent_id
      ORDER BY ar.started_at DESC LIMIT 60`);
    res.json({ runs: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/runs/:id', async (req, res) => {
  try {
    const run = await pool.query(`SELECT * FROM agent_runs WHERE id=$1`, [req.params.id]);
    if (!run.rows[0]) return res.status(404).json({ error: 'Not found' });
    const calls = await pool.query(`SELECT * FROM agent_tool_calls WHERE agent_run_id=$1 ORDER BY call_order`, [req.params.id]);
    const decisions = await pool.query(`SELECT * FROM decision_log WHERE agent_run_id=$1 ORDER BY created_at`, [req.params.id]);
    res.json({ run: run.rows[0], tool_calls: calls.rows, decisions: decisions.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
