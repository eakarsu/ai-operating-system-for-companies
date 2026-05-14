const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT e.*, ds.name AS source_name FROM events e LEFT JOIN data_sources ds ON e.source_id = ds.id ORDER BY e.occurred_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT e.*, ds.name AS source_name FROM events e LEFT JOIN data_sources ds ON e.source_id = ds.id WHERE e.id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { source_id, event_type, title, description, payload, severity, status, occurred_at } = req.body;
    const result = await db.query(
      'INSERT INTO events (source_id, event_type, title, description, payload, severity, status, occurred_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [source_id||null, event_type, title, description, payload, severity||'info', status||'new', occurred_at||new Date()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { source_id, event_type, title, description, payload, severity, status, occurred_at } = req.body;
    const result = await db.query(
      'UPDATE events SET source_id=$1, event_type=$2, title=$3, description=$4, payload=$5, severity=$6, status=$7, occurred_at=$8 WHERE id=$9 RETURNING *',
      [source_id||null, event_type, title, description, payload, severity, status, occurred_at, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
