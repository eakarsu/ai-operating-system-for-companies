// Retention / PII Redaction Policy — register patterns, run text through the
// engine, persist redaction stats. Pure-JS regex engine, no external deps.
// Tables: pii_policies, pii_redactions.

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const verifyToken = require("../middleware/auth");
const pool = require('../db');

router.use(verifyToken);

async function ensureTables() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS pii_policies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      pattern_type VARCHAR(40) NOT NULL,
      custom_regex TEXT,
      replacement VARCHAR(60) DEFAULT '[REDACTED]',
      retention_days INTEGER DEFAULT 90,
      enabled BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS pii_redactions (
      id SERIAL PRIMARY KEY,
      policy_id INTEGER,
      source_text_hash VARCHAR(64),
      matches_count INTEGER DEFAULT 0,
      redacted_preview TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch (e) { /* swallow */ }
}

const BUILTIN_PATTERNS = {
  email:       /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone:       /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g,
  ssn:         /\b\d{3}-\d{2}-\d{4}\b/g,
  credit_card: /\b(?:\d[ -]*?){13,19}\b/g,
};

function getPattern(p) {
  if (p.pattern_type === 'custom' && p.custom_regex) {
    try { return new RegExp(p.custom_regex, 'g'); } catch { return null; }
  }
  return BUILTIN_PATTERNS[p.pattern_type] || null;
}

router.get('/policies', async (_req, res) => {
  try {
    await ensureTables();
    const r = await pool.query('SELECT * FROM pii_policies ORDER BY enabled DESC, name');
    res.json({ policies: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/policies', async (req, res) => {
  try {
    await ensureTables();
    const b = req.body || {};
    if (!b.name || !b.pattern_type) return res.status(400).json({ error: 'name and pattern_type required' });
    if (b.pattern_type === 'custom' && !b.custom_regex) {
      return res.status(400).json({ error: 'custom_regex required for pattern_type=custom' });
    }
    if (b.pattern_type !== 'custom' && !BUILTIN_PATTERNS[b.pattern_type]) {
      return res.status(400).json({ error: `Unknown pattern_type. Use one of: ${Object.keys(BUILTIN_PATTERNS).join(',')},custom` });
    }
    const r = await pool.query(
      `INSERT INTO pii_policies (name, pattern_type, custom_regex, replacement, retention_days, enabled)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [b.name, b.pattern_type, b.custom_regex || null,
       b.replacement || '[REDACTED]', b.retention_days || 90,
       b.enabled === false ? false : true]
    );
    res.status(201).json({ policy: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/policies/:id', async (req, res) => {
  try {
    await ensureTables();
    await pool.query('DELETE FROM pii_policies WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Run text through all enabled policies; returns redacted text + per-policy match counts.
router.post('/redact', async (req, res) => {
  try {
    await ensureTables();
    const { text } = req.body || {};
    if (typeof text !== 'string') return res.status(400).json({ error: 'text (string) required' });
    const policies = (await pool.query('SELECT * FROM pii_policies WHERE enabled=true')).rows;
    let working = text;
    const breakdown = [];
    for (const p of policies) {
      const re = getPattern(p);
      if (!re) continue;
      const matches = working.match(re) || [];
      if (matches.length) {
        working = working.replace(re, p.replacement || '[REDACTED]');
        const hash = crypto.createHash('sha256').update(text).digest('hex');
        await pool.query(
          `INSERT INTO pii_redactions (policy_id, source_text_hash, matches_count, redacted_preview)
           VALUES ($1,$2,$3,$4)`,
          [p.id, hash, matches.length, working.slice(0, 240)]
        );
        breakdown.push({ policy_id: p.id, policy_name: p.name, pattern_type: p.pattern_type, matches: matches.length });
      }
    }
    res.json({ redacted: working, original_length: text.length, breakdown });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/redactions', async (req, res) => {
  try {
    await ensureTables();
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const r = await pool.query(
      `SELECT pr.*, pp.name AS policy_name, pp.pattern_type
       FROM pii_redactions pr LEFT JOIN pii_policies pp ON pp.id=pr.policy_id
       ORDER BY pr.created_at DESC LIMIT $1`, [limit]);
    res.json({ redactions: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Purge redaction logs older than each policy's retention window.
router.post('/purge-expired', async (_req, res) => {
  try {
    await ensureTables();
    const r = await pool.query(`
      DELETE FROM pii_redactions pr USING pii_policies pp
      WHERE pr.policy_id=pp.id
        AND pr.created_at < NOW() - (pp.retention_days || ' days')::interval
      RETURNING pr.id`);
    res.json({ purged: r.rows.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
