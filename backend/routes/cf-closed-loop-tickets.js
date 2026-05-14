// Closed-Loop Tickets — full lifecycle of anomaly/insight -> spec -> ticket
// -> resolution -> KPI outcome. Closes the loop the brief describes
// (open-loop -> closed-loop).

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { status, source_type, priority, kpi } = req.query;
    const where = [];
    const args = [];
    if (status)       { args.push(status); where.push(`status=$${args.length}`); }
    if (source_type)  { args.push(source_type); where.push(`source_type=$${args.length}`); }
    if (priority)     { args.push(priority); where.push(`priority=$${args.length}`); }
    if (kpi)          { args.push(kpi); where.push(`loop_closed_kpi=$${args.length}`); }

    const sql = `SELECT * FROM closed_loop_tickets
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY status='open' DESC, priority='critical' DESC, priority='high' DESC, created_at DESC`;
    const r = await pool.query(sql, args);
    res.json({ tickets: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/stats', async (_req, res) => {
  try {
    const byStatus = await pool.query(`SELECT status, COUNT(*) AS n FROM closed_loop_tickets GROUP BY status`);
    const bySource = await pool.query(`SELECT source_type, COUNT(*) AS n FROM closed_loop_tickets GROUP BY source_type`);
    const byPriority = await pool.query(`SELECT priority, COUNT(*) AS n FROM closed_loop_tickets GROUP BY priority`);
    // KPI loop-closure success rate
    const loopClosure = await pool.query(`
      SELECT loop_closed_kpi,
             COUNT(*) FILTER (WHERE status='resolved') AS resolved,
             COUNT(*) AS total,
             ROUND(AVG(CASE WHEN baseline_value IS NOT NULL AND outcome_value IS NOT NULL
               THEN (outcome_value - baseline_value) ELSE NULL END), 2) AS avg_delta
      FROM closed_loop_tickets
      WHERE loop_closed_kpi IS NOT NULL
      GROUP BY loop_closed_kpi`);
    const cycleTime = await pool.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/86400)::numeric(10,1) AS avg_days
      FROM closed_loop_tickets WHERE resolved_at IS NOT NULL`);
    res.json({
      by_status: byStatus.rows,
      by_source: bySource.rows,
      by_priority: byPriority.rows,
      loop_closure: loopClosure.rows,
      avg_cycle_days: cycleTime.rows[0]?.avg_days || null
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const t = await pool.query('SELECT * FROM closed_loop_tickets WHERE id=$1', [req.params.id]);
    if (!t.rows[0]) return res.status(404).json({ error: 'Not found' });

    // pull related KPI history if linked
    let kpiHistory = [];
    if (t.rows[0].loop_closed_kpi) {
      const r = await pool.query(`
        SELECT ks.period, ks.value, ks.status, ks.recorded_at
        FROM kpi_snapshots ks JOIN kpis k ON k.id=ks.kpi_id
        WHERE k.slug=$1 ORDER BY ks.recorded_at`, [t.rows[0].loop_closed_kpi]);
      kpiHistory = r.rows;
    }
    res.json({ ticket: t.rows[0], kpi_history: kpiHistory });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.title) return res.status(400).json({ error: 'title required' });
    const r = await pool.query(`INSERT INTO closed_loop_tickets
      (source_type, source_id, title, spec, assignee, external_url,
       status, priority, loop_closed_kpi, baseline_value)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [b.source_type || 'manual', b.source_id || null, b.title, b.spec || '',
       b.assignee || null, b.external_url || null, b.status || 'open',
       b.priority || 'medium', b.loop_closed_kpi || null, b.baseline_value || null]);
    res.status(201).json({ ticket: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const b = req.body || {};
    const fields = ['title','spec','assignee','external_url','status','priority',
      'loop_closed_kpi','baseline_value','outcome_value','resolution_notes'];
    const sets = [];
    const args = [];
    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(b, f)) {
        args.push(b[f]);
        sets.push(`${f}=$${args.length}`);
      }
    }
    if (b.status === 'resolved' && !b.resolved_at) {
      sets.push(`resolved_at=NOW()`);
    }
    if (!sets.length) return res.status(400).json({ error: 'No updatable fields' });
    args.push(req.params.id);
    const r = await pool.query(`UPDATE closed_loop_tickets SET ${sets.join(', ')}
      WHERE id=$${args.length} RETURNING *`, args);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ ticket: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/resolve', async (req, res) => {
  try {
    const { outcome_value, resolution_notes } = req.body || {};
    const r = await pool.query(`UPDATE closed_loop_tickets
      SET status='resolved', resolved_at=NOW(),
          outcome_value=COALESCE($2, outcome_value),
          resolution_notes=COALESCE($3, resolution_notes)
      WHERE id=$1 RETURNING *`, [req.params.id, outcome_value || null, resolution_notes || null]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });

    // Log a decision row capturing the closure.
    await pool.query(`INSERT INTO decision_log
      (decision_type, actor, subject, rationale, evidence, confidence_pct, reversible, human_approved)
      VALUES ('ticket_resolution', $1, $2, $3, $4, 95, true, true)`,
      [req.user?.email ? `human:${req.user.email}` : 'agent:executor',
       `Resolved ticket #${r.rows[0].id}: ${r.rows[0].title}`,
       resolution_notes || 'Manual closure',
       JSON.stringify({ baseline: r.rows[0].baseline_value, outcome: r.rows[0].outcome_value })]);
    res.json({ ticket: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM closed_loop_tickets WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
