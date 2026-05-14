const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Cross-entity search with filters
// GET /api/search?q=...&entities=events,insights&severity=high&status=open&from=2025-01-01&to=2026-01-01
router.get('/', auth, async (req, res) => {
  try {
    const { q, entities, severity, status, impact, category, department, from, to } = req.query;
    const wantedRaw = (entities || 'sources,events,insights,anomalies,queries,health').split(',').map(s => s.trim()).filter(Boolean);
    const allowed = new Set(['sources', 'events', 'insights', 'anomalies', 'queries', 'health']);
    const wanted = wantedRaw.filter(e => allowed.has(e));
    const out = {};
    const term = q ? `%${q}%` : null;

    const runFiltered = async (sql, params) => (await db.query(sql, params)).rows;

    if (wanted.includes('sources')) {
      const conds = []; const params = [];
      if (term) { params.push(term); conds.push(`(name ILIKE $${params.length} OR type ILIKE $${params.length} OR description ILIKE $${params.length} OR tags ILIKE $${params.length})`); }
      if (status) { params.push(status); conds.push(`status = $${params.length}`); }
      if (from) { params.push(from); conds.push(`created_at >= $${params.length}`); }
      if (to) { params.push(to); conds.push(`created_at <= $${params.length}`); }
      const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
      out.sources = await runFiltered(`SELECT * FROM data_sources ${where} ORDER BY created_at DESC LIMIT 100`, params);
    }

    if (wanted.includes('events')) {
      const conds = []; const params = [];
      if (term) { params.push(term); conds.push(`(e.title ILIKE $${params.length} OR e.event_type ILIKE $${params.length} OR e.description ILIKE $${params.length})`); }
      if (severity) { params.push(severity); conds.push(`e.severity = $${params.length}`); }
      if (status) { params.push(status); conds.push(`e.status = $${params.length}`); }
      if (from) { params.push(from); conds.push(`e.occurred_at >= $${params.length}`); }
      if (to) { params.push(to); conds.push(`e.occurred_at <= $${params.length}`); }
      const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
      out.events = await runFiltered(`SELECT e.*, ds.name AS source_name FROM events e LEFT JOIN data_sources ds ON e.source_id = ds.id ${where} ORDER BY e.occurred_at DESC LIMIT 100`, params);
    }

    if (wanted.includes('insights')) {
      const conds = []; const params = [];
      if (term) { params.push(term); conds.push(`(title ILIKE $${params.length} OR content ILIKE $${params.length} OR tags ILIKE $${params.length} OR assigned_to ILIKE $${params.length})`); }
      if (impact) { params.push(impact); conds.push(`impact = $${params.length}`); }
      if (status) { params.push(status); conds.push(`status = $${params.length}`); }
      if (category) { params.push(category); conds.push(`category = $${params.length}`); }
      if (from) { params.push(from); conds.push(`created_at >= $${params.length}`); }
      if (to) { params.push(to); conds.push(`created_at <= $${params.length}`); }
      const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
      out.insights = await runFiltered(`SELECT * FROM insights ${where} ORDER BY created_at DESC LIMIT 100`, params);
    }

    if (wanted.includes('anomalies')) {
      const conds = []; const params = [];
      if (term) { params.push(term); conds.push(`(a.metric_name ILIKE $${params.length} OR a.description ILIKE $${params.length})`); }
      if (severity) { params.push(severity); conds.push(`a.severity = $${params.length}`); }
      if (status) { params.push(status); conds.push(`a.status = $${params.length}`); }
      if (from) { params.push(from); conds.push(`a.detected_at >= $${params.length}`); }
      if (to) { params.push(to); conds.push(`a.detected_at <= $${params.length}`); }
      const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
      out.anomalies = await runFiltered(`SELECT a.*, ds.name AS source_name FROM anomalies a LEFT JOIN data_sources ds ON a.source_id = ds.id ${where} ORDER BY a.detected_at DESC LIMIT 100`, params);
    }

    if (wanted.includes('queries')) {
      const conds = []; const params = [];
      if (term) { params.push(term); conds.push(`(name ILIKE $${params.length} OR query_text ILIKE $${params.length} OR tags ILIKE $${params.length})`); }
      if (from) { params.push(from); conds.push(`created_at >= $${params.length}`); }
      if (to) { params.push(to); conds.push(`created_at <= $${params.length}`); }
      const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
      out.queries = await runFiltered(`SELECT * FROM saved_queries ${where} ORDER BY created_at DESC LIMIT 100`, params);
    }

    if (wanted.includes('health')) {
      const conds = []; const params = [];
      if (term) { params.push(term); conds.push(`(department ILIKE $${params.length} OR notes ILIKE $${params.length} OR period ILIKE $${params.length})`); }
      if (department) { params.push(department); conds.push(`department = $${params.length}`); }
      if (from) { params.push(from); conds.push(`recorded_at >= $${params.length}`); }
      if (to) { params.push(to); conds.push(`recorded_at <= $${params.length}`); }
      const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
      out.health = await runFiltered(`SELECT * FROM health_scores ${where} ORDER BY recorded_at DESC LIMIT 100`, params);
    }

    const total = Object.values(out).reduce((s, arr) => s + arr.length, 0);
    res.json({ total, results: out });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
