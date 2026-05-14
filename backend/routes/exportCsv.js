const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

const RESOURCE_QUERIES = {
  sources: 'SELECT * FROM data_sources ORDER BY id',
  events: 'SELECT e.*, ds.name AS source_name FROM events e LEFT JOIN data_sources ds ON e.source_id = ds.id ORDER BY e.id',
  insights: 'SELECT * FROM insights ORDER BY id',
  anomalies: 'SELECT a.*, ds.name AS source_name FROM anomalies a LEFT JOIN data_sources ds ON a.source_id = ds.id ORDER BY a.id',
  queries: 'SELECT * FROM saved_queries ORDER BY id',
  health: 'SELECT * FROM health_scores ORDER BY id',
  activity: 'SELECT * FROM activity_log ORDER BY id'
};

function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  let s;
  if (typeof value === 'object') {
    if (value instanceof Date) s = value.toISOString();
    else s = JSON.stringify(value);
  } else {
    s = String(value);
  }
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

router.get('/:resource', auth, async (req, res) => {
  try {
    const { resource } = req.params;
    const sql = RESOURCE_QUERIES[resource];
    if (!sql) return res.status(404).json({ error: 'Unknown resource' });
    const result = await db.query(sql);
    const rows = result.rows;
    if (rows.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${resource}.csv"`);
      return res.send('');
    }
    const headers = Object.keys(rows[0]);
    const lines = [headers.map(escapeCsv).join(',')];
    for (const row of rows) {
      lines.push(headers.map(h => escapeCsv(row[h])).join(','));
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${resource}.csv"`);
    res.send(lines.join('\n'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
