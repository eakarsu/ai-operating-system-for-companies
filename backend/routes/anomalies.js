const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT a.*, ds.name AS source_name FROM anomalies a LEFT JOIN data_sources ds ON a.source_id = ds.id ORDER BY a.detected_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT a.*, ds.name AS source_name FROM anomalies a LEFT JOIN data_sources ds ON a.source_id = ds.id WHERE a.id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { source_id, metric_name, expected_value, actual_value, deviation_pct, severity, description, status, detected_at } = req.body;
    const result = await db.query(
      'INSERT INTO anomalies (source_id, metric_name, expected_value, actual_value, deviation_pct, severity, description, status, detected_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [source_id||null, metric_name, expected_value, actual_value, deviation_pct, severity||'medium', description, status||'open', detected_at||new Date()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { source_id, metric_name, expected_value, actual_value, deviation_pct, severity, description, status, detected_at } = req.body;
    const result = await db.query(
      'UPDATE anomalies SET source_id=$1, metric_name=$2, expected_value=$3, actual_value=$4, deviation_pct=$5, severity=$6, description=$7, status=$8, detected_at=$9 WHERE id=$10 RETURNING *',
      [source_id||null, metric_name, expected_value, actual_value, deviation_pct, severity, description, status, detected_at, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM anomalies WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
