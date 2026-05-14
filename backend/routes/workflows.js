// Cross-functional Workflow Engine
// Lead -> Quote -> Contract -> Invoice -> Cash and related processes.
// Lists workflows + their runs + steps, advances steps, captures step
// outputs, and computes SLA-breach status.

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

router.get('/', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT w.id, w.slug, w.name, w.description, w.trigger_type, w.departments,
             w.step_definition, w.sla_hours, w.active,
             (SELECT COUNT(*) FROM workflow_runs WHERE workflow_id=w.id) AS total_runs,
             (SELECT COUNT(*) FROM workflow_runs WHERE workflow_id=w.id AND status='running') AS active_runs,
             (SELECT COUNT(*) FROM workflow_runs WHERE workflow_id=w.id AND status='blocked') AS blocked_runs,
             (SELECT COUNT(*) FROM workflow_runs WHERE workflow_id=w.id AND sla_breached=true) AS sla_breached
      FROM workflows w ORDER BY w.slug`);
    res.json({ workflows: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:slug', async (req, res) => {
  try {
    const w = await pool.query('SELECT * FROM workflows WHERE slug=$1', [req.params.slug]);
    if (!w.rows[0]) return res.status(404).json({ error: 'Not found' });
    const runs = await pool.query(`
      SELECT * FROM workflow_runs WHERE workflow_id=$1 ORDER BY started_at DESC LIMIT 50`,
      [w.rows[0].id]);
    res.json({ workflow: w.rows[0], runs: runs.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/runs/:id', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT wr.*, w.slug AS workflow_slug, w.name AS workflow_name, w.step_definition
      FROM workflow_runs wr
      JOIN workflows w ON w.id = wr.workflow_id
      WHERE wr.id=$1`, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    const steps = await pool.query(`
      SELECT ws.*, a.slug AS agent_slug, a.name AS agent_name
      FROM workflow_steps ws
      LEFT JOIN agents a ON a.slug = ws.agent
      WHERE ws.run_id=$1 ORDER BY ws.step_order`, [req.params.id]);
    const decisions = await pool.query(`SELECT * FROM decision_log WHERE workflow_run_id=$1 ORDER BY created_at`,
      [req.params.id]);
    res.json({ run: r.rows[0], steps: steps.rows, decisions: decisions.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.slug || !b.name) return res.status(400).json({ error: 'slug+name required' });
    const r = await pool.query(`INSERT INTO workflows
      (slug, name, description, trigger_type, departments, step_definition, sla_hours, active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,COALESCE($8,true)) RETURNING *`,
      [b.slug, b.name, b.description || null, b.trigger_type || 'manual',
       b.departments || null, b.step_definition || null, b.sla_hours || null,
       b.active]);
    res.status(201).json({ workflow: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:slug/start', async (req, res) => {
  try {
    const w = await pool.query('SELECT * FROM workflows WHERE slug=$1 AND active=true', [req.params.slug]);
    if (!w.rows[0]) return res.status(404).json({ error: 'Workflow not found or inactive' });

    const b = req.body || {};
    const steps = w.rows[0].step_definition || [];
    const first = steps[0]?.name || 'start';
    const run = await pool.query(`INSERT INTO workflow_runs
      (workflow_id, external_ref, subject, current_step, status, amount_usd, context)
      VALUES ($1,$2,$3,$4,'running',$5,$6) RETURNING *`,
      [w.rows[0].id, b.external_ref || null, b.subject || `${w.rows[0].name} run`,
       first, b.amount_usd || null, b.context || {}]);

    // Pre-seed step rows
    for (let i = 0; i < steps.length; i++) {
      await pool.query(`INSERT INTO workflow_steps
        (run_id, step_name, step_order, status, agent)
        VALUES ($1,$2,$3,$4,$5)`,
        [run.rows[0].id, steps[i].name, i + 1,
         i === 0 ? 'running' : 'pending', steps[i].agent || null]);
    }
    res.status(201).json({ run: run.rows[0], steps_seeded: steps.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/runs/:id/advance', async (req, res) => {
  try {
    const { output, status_override } = req.body || {};
    const r = await pool.query(`SELECT wr.*, w.step_definition, w.sla_hours
      FROM workflow_runs wr JOIN workflows w ON w.id=wr.workflow_id WHERE wr.id=$1`, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    const run = r.rows[0];
    const steps = run.step_definition || [];
    const curIdx = steps.findIndex(s => s.name === run.current_step);
    if (curIdx < 0) return res.status(409).json({ error: 'current_step not in definition' });

    // Mark current step ok
    await pool.query(`UPDATE workflow_steps SET status='ok', output=$2,
      finished_at=NOW(), duration_ms=EXTRACT(EPOCH FROM NOW() - started_at)*1000
      WHERE run_id=$1 AND step_order=$3`,
      [req.params.id, output || null, curIdx + 1]);

    const nextStep = steps[curIdx + 1];
    if (!nextStep) {
      const fin = await pool.query(`UPDATE workflow_runs
        SET status=COALESCE($2,'succeeded'), finished_at=NOW() WHERE id=$1 RETURNING *`,
        [req.params.id, status_override || null]);
      return res.json({ run: fin.rows[0], advanced: false, completed: true });
    }
    await pool.query(`UPDATE workflow_steps SET status='running', started_at=NOW()
      WHERE run_id=$1 AND step_order=$2`, [req.params.id, curIdx + 2]);

    // SLA breach computation
    const slaBreach = run.sla_hours && run.started_at &&
      (Date.now() - new Date(run.started_at).getTime()) > run.sla_hours * 3600 * 1000;
    const upd = await pool.query(`UPDATE workflow_runs
      SET current_step=$2, sla_breached=$3 WHERE id=$1 RETURNING *`,
      [req.params.id, nextStep.name, slaBreach]);
    res.json({ run: upd.rows[0], advanced: true, next_step: nextStep.name });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/runs/:id/block', async (req, res) => {
  try {
    const { reason } = req.body || {};
    const r = await pool.query(`UPDATE workflow_runs SET status='blocked',
      context = COALESCE(context,'{}'::jsonb) || $2::jsonb
      WHERE id=$1 RETURNING *`,
      [req.params.id, JSON.stringify({ block_reason: reason || 'manual' })]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ run: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/_summary/by-status', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT w.slug, w.name,
             COUNT(wr.id) FILTER (WHERE wr.status='running') AS running,
             COUNT(wr.id) FILTER (WHERE wr.status='blocked') AS blocked,
             COUNT(wr.id) FILTER (WHERE wr.status='succeeded') AS succeeded,
             COUNT(wr.id) FILTER (WHERE wr.status='failed') AS failed,
             COUNT(wr.id) FILTER (WHERE wr.sla_breached=true) AS sla_breached,
             COALESCE(SUM(wr.amount_usd) FILTER (WHERE wr.status='succeeded'), 0) AS cash_unlocked,
             COALESCE(SUM(wr.amount_usd) FILTER (WHERE wr.status IN ('running','blocked')), 0) AS at_risk
      FROM workflows w
      LEFT JOIN workflow_runs wr ON wr.workflow_id=w.id
      GROUP BY w.slug, w.name ORDER BY w.slug`);
    res.json({ rows: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
