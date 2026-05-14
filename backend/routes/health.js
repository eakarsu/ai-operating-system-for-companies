const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM health_scores ORDER BY recorded_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM health_scores WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { department, overall_score, productivity_score, velocity_score, quality_score, collaboration_score, trend, notes, period } = req.body;
    const result = await db.query(
      'INSERT INTO health_scores (department, overall_score, productivity_score, velocity_score, quality_score, collaboration_score, trend, notes, period) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [department, overall_score, productivity_score, velocity_score, quality_score, collaboration_score, trend||'stable', notes, period]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { department, overall_score, productivity_score, velocity_score, quality_score, collaboration_score, trend, notes, period } = req.body;
    const result = await db.query(
      'UPDATE health_scores SET department=$1, overall_score=$2, productivity_score=$3, velocity_score=$4, quality_score=$5, collaboration_score=$6, trend=$7, notes=$8, period=$9 WHERE id=$10 RETURNING *',
      [department, overall_score, productivity_score, velocity_score, quality_score, collaboration_score, trend, notes, period, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM health_scores WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
