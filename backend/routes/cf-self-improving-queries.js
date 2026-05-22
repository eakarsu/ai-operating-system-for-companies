// Self-Improving Query Library — operators rate saved_queries and propose
// improved versions; high-rated improvements can be auto-applied to update
// the saved_queries row. Closes the feedback loop on the NL/SQL library.
// Table: query_feedback. Reads/updates saved_queries.

const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');

router.use(verifyToken);

async function ensureTables() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS query_feedback (
      id SERIAL PRIMARY KEY,
      query_id INTEGER,
      rating INTEGER,
      was_useful BOOLEAN,
      comment TEXT,
      improved_text TEXT,
      applied BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch (e) { /* swallow */ }
}

// Submit feedback on a saved query.
router.post('/feedback', async (req, res) => {
  try {
    await ensureTables();
    const { query_id, rating, was_useful, comment, improved_text } = req.body || {};
    if (!query_id) return res.status(400).json({ error: 'query_id required' });
    const exists = await pool.query('SELECT id FROM saved_queries WHERE id=$1', [query_id]);
    if (!exists.rows[0]) return res.status(404).json({ error: 'saved_query not found' });
    const r = await pool.query(
      `INSERT INTO query_feedback (query_id, rating, was_useful, comment, improved_text)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [query_id, rating || null, was_useful === undefined ? null : !!was_useful,
       comment || null, improved_text || null]
    );
    res.status(201).json({ feedback: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Feedback for one query.
router.get('/feedback/:query_id', async (req, res) => {
  try {
    await ensureTables();
    const r = await pool.query(
      `SELECT * FROM query_feedback WHERE query_id=$1 ORDER BY created_at DESC`,
      [req.params.query_id]
    );
    res.json({ feedback: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Apply a proposed improvement: copies improved_text into saved_queries.query_text.
router.post('/apply/:feedback_id', async (req, res) => {
  try {
    await ensureTables();
    const fb = (await pool.query('SELECT * FROM query_feedback WHERE id=$1', [req.params.feedback_id])).rows[0];
    if (!fb) return res.status(404).json({ error: 'feedback not found' });
    if (!fb.improved_text) return res.status(400).json({ error: 'feedback has no improved_text' });
    await pool.query(`UPDATE saved_queries SET query_text=$1 WHERE id=$2`, [fb.improved_text, fb.query_id]);
    await pool.query(`UPDATE query_feedback SET applied=true WHERE id=$1`, [fb.id]);
    res.json({ ok: true, query_id: fb.query_id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Library overview: per-query stats + low-rated outliers ready for rework.
router.get('/library', async (_req, res) => {
  try {
    await ensureTables();
    const rows = (await pool.query(`
      SELECT sq.id, sq.name, sq.query_type, sq.run_count, sq.last_run_at,
             COUNT(qf.id) AS feedback_count,
             ROUND(AVG(qf.rating)::numeric, 2) AS avg_rating,
             COUNT(qf.id) FILTER (WHERE qf.was_useful) AS useful_count,
             COUNT(qf.id) FILTER (WHERE qf.improved_text IS NOT NULL AND qf.applied=false) AS pending_improvements
      FROM saved_queries sq
      LEFT JOIN query_feedback qf ON qf.query_id=sq.id
      GROUP BY sq.id ORDER BY sq.run_count DESC NULLS LAST, sq.created_at DESC LIMIT 100`)).rows;
    const rework = rows.filter(r => r.avg_rating !== null && Number(r.avg_rating) <= 2).slice(0, 10);
    const top    = rows.filter(r => r.avg_rating !== null && Number(r.avg_rating) >= 4).slice(0, 10);
    res.json({ queries: rows, rework_candidates: rework, top_rated: top });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Recent improvements pending review.
router.get('/pending', async (_req, res) => {
  try {
    await ensureTables();
    const r = await pool.query(`
      SELECT qf.*, sq.name AS query_name, sq.query_text AS current_text
      FROM query_feedback qf JOIN saved_queries sq ON sq.id=qf.query_id
      WHERE qf.improved_text IS NOT NULL AND qf.applied=false
      ORDER BY qf.created_at DESC LIMIT 50`);
    res.json({ pending: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
