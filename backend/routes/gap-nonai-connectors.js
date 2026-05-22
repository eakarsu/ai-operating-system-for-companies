// Connector Code (Slack/Linear/GitHub etc.) — lightweight per-tenant
// connector scripts that wire a vendor into a topic. Stored as inert text
// (not eval'd here); operators can register/edit/list/mark runs.
// Table: connector_scripts.

const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');

router.use(verifyToken);

async function ensureTables() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS connector_scripts (
      id SERIAL PRIMARY KEY,
      vendor VARCHAR(60) NOT NULL,
      topic VARCHAR(80),
      language VARCHAR(20) DEFAULT 'javascript',
      body TEXT,
      active BOOLEAN DEFAULT TRUE,
      last_run_at TIMESTAMP,
      last_run_status VARCHAR(20),
      created_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch (e) { /* swallow */ }
}

const TEMPLATES = {
  slack:  `// Slack: post a channel message\nmodule.exports = async ({ channel, text }) => {\n  // call Slack chat.postMessage with stored OAuth token\n  return { ok: true, channel, text };\n};`,
  linear: `// Linear: create an issue\nmodule.exports = async ({ team, title, description }) => {\n  // call Linear GraphQL issueCreate\n  return { ok: true, team, title };\n};`,
  github: `// GitHub: open a PR\nmodule.exports = async ({ repo, head, base, title, body }) => {\n  // POST /repos/:owner/:repo/pulls\n  return { ok: true, repo, head, base, title };\n};`,
  gmail:  `// Gmail: draft a reply\nmodule.exports = async ({ thread_id, body }) => {\n  return { ok: true, thread_id };\n};`,
};

router.get('/templates', async (_req, res) => {
  res.json({ templates: Object.entries(TEMPLATES).map(([vendor, body]) => ({ vendor, body })) });
});

router.get('/', async (req, res) => {
  try {
    await ensureTables();
    const { vendor, active } = req.query;
    const where = []; const args = [];
    if (vendor) { args.push(vendor); where.push(`vendor=$${args.length}`); }
    if (active !== undefined) { args.push(active === 'true'); where.push(`active=$${args.length}`); }
    const sql = `SELECT id, vendor, topic, language, active, last_run_at, last_run_status, created_at,
                        LEFT(COALESCE(body,''), 120) AS body_preview
                 FROM connector_scripts
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY active DESC, vendor, topic`;
    const r = await pool.query(sql, args);
    res.json({ scripts: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    await ensureTables();
    const r = await pool.query('SELECT * FROM connector_scripts WHERE id=$1', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ script: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    await ensureTables();
    const b = req.body || {};
    if (!b.vendor) return res.status(400).json({ error: 'vendor required' });
    const body = b.body || TEMPLATES[b.vendor] || `// ${b.vendor} connector\nmodule.exports = async (input) => ({ ok: true });`;
    const r = await pool.query(
      `INSERT INTO connector_scripts (vendor, topic, language, body, active)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [b.vendor, b.topic || null, b.language || 'javascript', body, b.active === false ? false : true]
    );
    res.status(201).json({ script: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    await ensureTables();
    const b = req.body || {};
    const fields = ['vendor','topic','language','body','active'];
    const sets = []; const args = [];
    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(b, f)) { args.push(b[f]); sets.push(`${f}=$${args.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: 'No updatable fields' });
    args.push(req.params.id);
    const r = await pool.query(`UPDATE connector_scripts SET ${sets.join(', ')} WHERE id=$${args.length} RETURNING *`, args);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ script: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await ensureTables();
    await pool.query('DELETE FROM connector_scripts WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Mark a synthetic run (real execution would happen in a sandboxed worker).
router.post('/:id/mark-run', async (req, res) => {
  try {
    await ensureTables();
    const status = (req.body && req.body.status) || 'ok';
    const r = await pool.query(
      `UPDATE connector_scripts SET last_run_at=NOW(), last_run_status=$1 WHERE id=$2 RETURNING *`,
      [status, req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ script: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
