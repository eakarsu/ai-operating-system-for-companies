// Alerting / Notifications — real alert-rule registry + evaluator + delivery log.
// Operators register rules matching a field on an entity type; POST /evaluate
// re-scans recent anomalies/events and fires alert_events. Channels stored as
// metadata; actual delivery is a stub (channel='in_app' is immediate, others
// remain 'queued' for a real worker). Tables: alert_rules, alert_events.

const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');

router.use(verifyToken);

async function ensureTables() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS alert_rules (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      entity_type VARCHAR(60) NOT NULL,
      match_field VARCHAR(60),
      match_value VARCHAR(120),
      operator VARCHAR(10) DEFAULT '=',
      channel VARCHAR(40) NOT NULL,
      destination TEXT,
      enabled BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS alert_events (
      id SERIAL PRIMARY KEY,
      rule_id INTEGER,
      entity_type VARCHAR(60),
      entity_id INTEGER,
      channel VARCHAR(40),
      destination TEXT,
      payload JSONB,
      status VARCHAR(20) DEFAULT 'queued',
      fired_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch (e) { /* swallow */ }
}

router.get('/rules', async (_req, res) => {
  try {
    await ensureTables();
    const r = await pool.query('SELECT * FROM alert_rules ORDER BY enabled DESC, created_at DESC');
    res.json({ rules: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/rules', async (req, res) => {
  try {
    await ensureTables();
    const b = req.body || {};
    if (!b.name || !b.entity_type || !b.channel) {
      return res.status(400).json({ error: 'name, entity_type, channel required' });
    }
    const r = await pool.query(
      `INSERT INTO alert_rules (name, entity_type, match_field, match_value, operator, channel, destination, enabled)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [b.name, b.entity_type, b.match_field || null, b.match_value || null,
       b.operator || '=', b.channel, b.destination || null,
       b.enabled === false ? false : true]
    );
    res.status(201).json({ rule: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/rules/:id', async (req, res) => {
  try {
    await ensureTables();
    const b = req.body || {};
    const fields = ['name','entity_type','match_field','match_value','operator','channel','destination','enabled'];
    const sets = []; const args = [];
    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(b, f)) { args.push(b[f]); sets.push(`${f}=$${args.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: 'No updatable fields' });
    args.push(req.params.id);
    const r = await pool.query(`UPDATE alert_rules SET ${sets.join(', ')} WHERE id=$${args.length} RETURNING *`, args);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ rule: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/rules/:id', async (req, res) => {
  try {
    await ensureTables();
    await pool.query('DELETE FROM alert_rules WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Evaluate rules against the last ~24h of relevant entities; insert alert_events.
router.post('/evaluate', async (_req, res) => {
  try {
    await ensureTables();
    const rules = (await pool.query('SELECT * FROM alert_rules WHERE enabled=true')).rows;
    let fired = 0;
    for (const rule of rules) {
      let rows = [];
      if (rule.entity_type === 'anomaly') {
        rows = (await pool.query(
          `SELECT id, severity, status, metric_name, description FROM anomalies
           WHERE detected_at > NOW() - INTERVAL '24 hours'`)).rows;
      } else if (rule.entity_type === 'event') {
        rows = (await pool.query(
          `SELECT id, severity, status, event_type, title FROM events
           WHERE occurred_at > NOW() - INTERVAL '24 hours'`)).rows;
      } else if (rule.entity_type === 'health') {
        rows = (await pool.query(
          `SELECT id, department, overall_score, trend FROM health_scores
           WHERE recorded_at > NOW() - INTERVAL '24 hours'`)).rows;
      } else if (rule.entity_type === 'kpi') {
        rows = (await pool.query(
          `SELECT ks.id, k.slug AS metric_name, ks.status, ks.value
           FROM kpi_snapshots ks JOIN kpis k ON k.id=ks.kpi_id
           WHERE ks.recorded_at > NOW() - INTERVAL '24 hours'`)).rows;
      }
      const op = rule.operator || '=';
      const target = rule.match_value;
      const field = rule.match_field;
      const matches = rows.filter(r => {
        if (!field) return true;
        const v = r[field];
        if (v === undefined || v === null) return false;
        if (op === '=')        return String(v) === String(target);
        if (op === '!=')       return String(v) !== String(target);
        if (op === '>')        return Number(v) > Number(target);
        if (op === '<')        return Number(v) < Number(target);
        if (op === 'contains') return String(v).toLowerCase().includes(String(target || '').toLowerCase());
        return false;
      });
      for (const m of matches) {
        await pool.query(
          `INSERT INTO alert_events (rule_id, entity_type, entity_id, channel, destination, payload, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [rule.id, rule.entity_type, m.id, rule.channel, rule.destination,
           m, rule.channel === 'in_app' ? 'sent' : 'queued']
        );
        fired++;
      }
    }
    res.json({ rules_evaluated: rules.length, alerts_fired: fired });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/events', async (req, res) => {
  try {
    await ensureTables();
    const { status, entity_type, limit } = req.query;
    const where = []; const args = [];
    if (status)      { args.push(status); where.push(`status=$${args.length}`); }
    if (entity_type) { args.push(entity_type); where.push(`entity_type=$${args.length}`); }
    args.push(Math.min(parseInt(limit) || 50, 200));
    const sql = `SELECT * FROM alert_events ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY fired_at DESC LIMIT $${args.length}`;
    const r = await pool.query(sql, args);
    res.json({ events: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/events/:id/ack', async (req, res) => {
  try {
    await ensureTables();
    const r = await pool.query(`UPDATE alert_events SET status='ack' WHERE id=$1 RETURNING *`, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ event: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
