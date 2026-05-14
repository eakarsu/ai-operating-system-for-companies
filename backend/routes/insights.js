const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM insights ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM insights WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, category, content, confidence_score, impact, action_required, assigned_to, status, tags } = req.body;
    const result = await db.query(
      'INSERT INTO insights (title, category, content, confidence_score, impact, action_required, assigned_to, status, tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [title, category||'operational', content, confidence_score, impact||'medium', action_required||false, assigned_to, status||'new', tags]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, category, content, confidence_score, impact, action_required, assigned_to, status, tags } = req.body;
    const result = await db.query(
      'UPDATE insights SET title=$1, category=$2, content=$3, confidence_score=$4, impact=$5, action_required=$6, assigned_to=$7, status=$8, tags=$9 WHERE id=$10 RETURNING *',
      [title, category, content, confidence_score, impact, action_required, assigned_to, status, tags, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM insights WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
