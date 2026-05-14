// KPI Registry & Snapshots — real SaaS KPI definitions (CAC, LTV, NRR,
// burn multiple) with period snapshots, target tracking, status banding,
// trend computation, and LLM-narrated executive summaries.

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
        'X-Title': 'KPI Registry'
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

function bandStatus(value, target, good_direction) {
  if (value == null || target == null) return 'unknown';
  if (good_direction === 'up') {
    if (value >= target)            return 'green';
    if (value >= target * 0.9)      return 'yellow';
    return 'red';
  } else {
    if (value <= target)            return 'green';
    if (value <= target * 1.1)      return 'yellow';
    return 'red';
  }
}

router.get('/', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT k.id, k.slug, k.name, k.department, k.unit, k.formula,
             k.source_connectors, k.target_value, k.good_direction,
             k.cadence, k.description,
             (SELECT ks.value FROM kpi_snapshots ks WHERE ks.kpi_id=k.id ORDER BY ks.recorded_at DESC LIMIT 1) AS current_value,
             (SELECT ks.period FROM kpi_snapshots ks WHERE ks.kpi_id=k.id ORDER BY ks.recorded_at DESC LIMIT 1) AS current_period,
             (SELECT ks.delta_pct FROM kpi_snapshots ks WHERE ks.kpi_id=k.id ORDER BY ks.recorded_at DESC LIMIT 1) AS delta_pct
      FROM kpis k ORDER BY k.department, k.slug`);
    const enriched = r.rows.map(k => ({
      ...k,
      status: bandStatus(Number(k.current_value), Number(k.target_value), k.good_direction)
    }));
    res.json({ kpis: enriched });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/dashboard', async (_req, res) => {
  try {
    const grouped = await pool.query(`
      SELECT k.department, COUNT(*) AS kpi_count
      FROM kpis k GROUP BY k.department`);
    const latest = await pool.query(`
      SELECT k.slug, k.name, k.department, k.unit, k.target_value, k.good_direction,
             ks.value, ks.delta_pct, ks.period, ks.status, ks.recorded_at
      FROM kpis k
      JOIN LATERAL (
        SELECT * FROM kpi_snapshots WHERE kpi_id=k.id ORDER BY recorded_at DESC LIMIT 1
      ) ks ON true
      ORDER BY k.department, k.slug`);
    const reds = latest.rows.filter(k => bandStatus(Number(k.value), Number(k.target_value), k.good_direction) === 'red');
    const yellows = latest.rows.filter(k => bandStatus(Number(k.value), Number(k.target_value), k.good_direction) === 'yellow');
    res.json({
      grouped: grouped.rows,
      latest: latest.rows.map(k => ({ ...k, computed_status: bandStatus(Number(k.value), Number(k.target_value), k.good_direction) })),
      red_count: reds.length, yellow_count: yellows.length,
      total: latest.rows.length
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:slug', async (req, res) => {
  try {
    const k = await pool.query('SELECT * FROM kpis WHERE slug=$1', [req.params.slug]);
    if (!k.rows[0]) return res.status(404).json({ error: 'Not found' });
    const snaps = await pool.query(
      'SELECT * FROM kpi_snapshots WHERE kpi_id=$1 ORDER BY recorded_at',
      [k.rows[0].id]);
    res.json({ kpi: k.rows[0], snapshots: snaps.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:slug/snapshot', async (req, res) => {
  try {
    const { period, value, notes } = req.body || {};
    if (!period || value === undefined) return res.status(400).json({ error: 'period+value required' });
    const k = await pool.query('SELECT * FROM kpis WHERE slug=$1', [req.params.slug]);
    if (!k.rows[0]) return res.status(404).json({ error: 'KPI not found' });

    const prev = await pool.query(
      'SELECT value FROM kpi_snapshots WHERE kpi_id=$1 ORDER BY recorded_at DESC LIMIT 1', [k.rows[0].id]);
    const prevVal = prev.rows[0]?.value || null;
    const deltaPct = prevVal ? ((Number(value) - Number(prevVal)) / Number(prevVal) * 100).toFixed(2) : null;
    const status = bandStatus(Number(value), Number(k.rows[0].target_value), k.rows[0].good_direction);

    const ins = await pool.query(`INSERT INTO kpi_snapshots
      (kpi_id, period, value, prev_value, delta_pct, status, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [k.rows[0].id, period, value, prevVal, deltaPct, status, notes || null]);

    // If red breach, auto-create a closed-loop ticket
    if (status === 'red') {
      await pool.query(`INSERT INTO closed_loop_tickets
        (source_type, source_id, title, spec, priority, status, loop_closed_kpi, baseline_value)
        VALUES ('kpi_breach', $1, $2, $3, 'high', 'open', $4, $5)
        ON CONFLICT DO NOTHING`,
        [k.rows[0].id, `${k.rows[0].name} below target (${period})`,
         `KPI ${k.rows[0].slug} = ${value} ${k.rows[0].unit}; target ${k.rows[0].target_value}. Investigate root cause and propose mitigation.`,
         k.rows[0].slug, value]);
    }
    res.status(201).json({ snapshot: ins.rows[0], computed_status: status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:slug/narrate', async (req, res) => {
  try {
    const k = await pool.query('SELECT * FROM kpis WHERE slug=$1', [req.params.slug]);
    if (!k.rows[0]) return res.status(404).json({ error: 'Not found' });
    const snaps = await pool.query(
      'SELECT period, value, delta_pct, status, notes FROM kpi_snapshots WHERE kpi_id=$1 ORDER BY recorded_at DESC LIMIT 8',
      [k.rows[0].id]);

    const sys = `You are an FP&A analyst. Given a KPI and its recent snapshots,
write a 4-sentence narrative: (1) where it sits vs target; (2) the trend; (3) the
likely driver; (4) the recommended next action. No fluff, no bullets.`;
    const usr = `KPI: ${k.rows[0].name} (${k.rows[0].slug})
Unit: ${k.rows[0].unit}
Target: ${k.rows[0].target_value} (good direction: ${k.rows[0].good_direction})
Formula: ${k.rows[0].formula}
Department: ${k.rows[0].department}

Recent snapshots (newest first):
${snaps.rows.map(s => `- ${s.period}: ${s.value} (Δ ${s.delta_pct || '?'}%) [${s.status}] ${s.notes || ''}`).join('\n')}`;

    const llm = await callAI(sys, usr);
    res.json({
      kpi: k.rows[0],
      snapshots: snaps.rows,
      narration: llm || `${k.rows[0].name} stands at ${snaps.rows[0]?.value || '?'} ${k.rows[0].unit} vs target ${k.rows[0].target_value}. Trend over last ${snaps.rows.length} periods is ${snaps.rows[0]?.delta_pct >= 0 ? 'up' : 'flat/down'}. Driver and next action require human follow-up.`,
      llm_used: !!llm
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/board/pack', async (_req, res) => {
  try {
    // Roll-up: red/yellow/green counts per department + top 5 reds + ARR snapshot
    const dash = await pool.query(`
      SELECT k.department,
             COUNT(*) AS total,
             COUNT(*) FILTER (WHERE ks.status='green') AS green,
             COUNT(*) FILTER (WHERE ks.status='yellow') AS yellow,
             COUNT(*) FILTER (WHERE ks.status='red') AS red
      FROM kpis k
      JOIN LATERAL (SELECT status FROM kpi_snapshots WHERE kpi_id=k.id ORDER BY recorded_at DESC LIMIT 1) ks ON true
      GROUP BY k.department ORDER BY k.department`);
    const topReds = await pool.query(`
      SELECT k.slug, k.name, k.department, ks.value, ks.delta_pct, ks.period
      FROM kpis k
      JOIN LATERAL (SELECT * FROM kpi_snapshots WHERE kpi_id=k.id ORDER BY recorded_at DESC LIMIT 1) ks ON true
      WHERE ks.status IN ('red','yellow') ORDER BY ks.status='red' DESC LIMIT 5`);
    res.json({ by_department: dash.rows, top_concerns: topReds.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
