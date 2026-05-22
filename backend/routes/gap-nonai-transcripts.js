// Call Recording / Transcript Ingest — CRUD over transcripts plus a
// deterministic summarizer + action-item extractor (regex-based; no LLM
// dependency). Use POST /ingest to push a transcript, GET /:id for detail,
// POST /:id/summarize to (re-)compute summary + action items.
// Table: transcripts.

const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');

router.use(verifyToken);

async function ensureTables() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS transcripts (
      id SERIAL PRIMARY KEY,
      source VARCHAR(60),
      external_id VARCHAR(160),
      title VARCHAR(255),
      participants TEXT,
      meeting_at TIMESTAMP,
      duration_min INTEGER,
      body TEXT,
      summary TEXT,
      action_items TEXT,
      sentiment VARCHAR(20),
      tags TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch (e) { /* swallow */ }
}

function summarize(body) {
  const text = (body || '').replace(/\s+/g, ' ').trim();
  if (!text) return { summary: '', action_items: '', sentiment: 'neutral' };
  // crude sentence split
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  // top-5 longest sentences as the "extract"
  const summary = sentences.slice().sort((a, b) => b.length - a.length).slice(0, 5).join(' ');
  const actionRe = /\b(action item|todo|follow.?up|i'?ll|we'?ll|will|need to|let'?s|owner:)\s+([^.!?]{8,140})/gi;
  const items = [];
  let m;
  while ((m = actionRe.exec(text)) !== null) items.push(m[0].trim());
  const lower = text.toLowerCase();
  let sentiment = 'neutral';
  const pos = (lower.match(/\b(great|awesome|love|win|excited|nailed|exceeded|on track)\b/g) || []).length;
  const neg = (lower.match(/\b(concern|risk|blocker|delay|missed|frustrat|angry|churn|escalat)\b/g) || []).length;
  if (pos - neg >= 2) sentiment = 'positive';
  else if (neg - pos >= 2) sentiment = 'negative';
  return {
    summary: summary.slice(0, 1200),
    action_items: items.slice(0, 12).join('\n'),
    sentiment
  };
}

router.get('/', async (req, res) => {
  try {
    await ensureTables();
    const { source, tag, limit } = req.query;
    const where = []; const args = [];
    if (source) { args.push(source); where.push(`source=$${args.length}`); }
    if (tag)    { args.push(`%${tag}%`); where.push(`tags ILIKE $${args.length}`); }
    args.push(Math.min(parseInt(limit) || 50, 200));
    const sql = `SELECT id, source, external_id, title, participants, meeting_at,
                        duration_min, sentiment, tags, created_at,
                        LEFT(COALESCE(summary,''), 240) AS summary_preview
                 FROM transcripts
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY COALESCE(meeting_at, created_at) DESC LIMIT $${args.length}`;
    const r = await pool.query(sql, args);
    res.json({ transcripts: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    await ensureTables();
    const r = await pool.query('SELECT * FROM transcripts WHERE id=$1', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ transcript: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/ingest', async (req, res) => {
  try {
    await ensureTables();
    const b = req.body || {};
    if (!b.body) return res.status(400).json({ error: 'body (transcript text) required' });
    const { summary, action_items, sentiment } = summarize(b.body);
    const r = await pool.query(
      `INSERT INTO transcripts
       (source, external_id, title, participants, meeting_at, duration_min,
        body, summary, action_items, sentiment, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [b.source || 'manual', b.external_id || null,
       b.title || (b.body.slice(0, 80).trim() + '...'),
       Array.isArray(b.participants) ? b.participants.join(',') : (b.participants || ''),
       b.meeting_at || null, b.duration_min || null,
       b.body, summary, action_items, sentiment,
       Array.isArray(b.tags) ? b.tags.join(',') : (b.tags || '')]
    );
    res.status(201).json({ transcript: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/summarize', async (req, res) => {
  try {
    await ensureTables();
    const existing = await pool.query('SELECT body FROM transcripts WHERE id=$1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Not found' });
    const { summary, action_items, sentiment } = summarize(existing.rows[0].body);
    const r = await pool.query(
      `UPDATE transcripts SET summary=$1, action_items=$2, sentiment=$3 WHERE id=$4 RETURNING *`,
      [summary, action_items, sentiment, req.params.id]
    );
    res.json({ transcript: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await ensureTables();
    await pool.query('DELETE FROM transcripts WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
