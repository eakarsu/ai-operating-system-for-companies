const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM saved_queries ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM saved_queries WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    await db.query('UPDATE saved_queries SET run_count = run_count + 1 WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, query_text, query_type, result_summary, tags, is_scheduled, schedule_frequency } = req.body;
    const result = await db.query(
      'INSERT INTO saved_queries (name, query_text, query_type, result_summary, tags, is_scheduled, schedule_frequency, run_count) VALUES ($1,$2,$3,$4,$5,$6,$7,0) RETURNING *',
      [name, query_text, query_type||'natural_language', result_summary, tags, is_scheduled||false, schedule_frequency]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, query_text, query_type, result_summary, tags, is_scheduled, schedule_frequency } = req.body;
    const result = await db.query(
      'UPDATE saved_queries SET name=$1, query_text=$2, query_type=$3, result_summary=$4, tags=$5, is_scheduled=$6, schedule_frequency=$7 WHERE id=$8 RETURNING *',
      [name, query_text, query_type, result_summary, tags, is_scheduled, schedule_frequency, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM saved_queries WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
