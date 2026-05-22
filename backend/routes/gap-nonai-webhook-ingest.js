// Webhook Ingestion — register inbound webhook subscriptions and accept
// deliveries. Verifies optional HMAC-SHA256 signature header against the
// stored secret. Promotes recognized payloads into the events table.
// Tables: webhook_subscriptions, webhook_deliveries. (Events table reused.)

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const verifyToken = require("../middleware/auth");
const pool = require('../db');

async function ensureTables() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS webhook_subscriptions (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(80) UNIQUE NOT NULL,
      vendor VARCHAR(80),
      description TEXT,
      secret VARCHAR(120),
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id SERIAL PRIMARY KEY,
      subscription_slug VARCHAR(80) NOT NULL,
      event_type VARCHAR(120),
      headers JSONB,
      payload JSONB,
      status VARCHAR(20) DEFAULT 'received',
      received_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch (e) { /* swallow */ }
}

// The public ingest endpoint is intentionally NOT behind auth — vendors call
// it directly. Verification is via HMAC against the stored secret when present.
router.post('/in/:slug', express.json({ limit: '1mb' }), async (req, res) => {
  try {
    await ensureTables();
    const sub = (await pool.query(
      'SELECT * FROM webhook_subscriptions WHERE slug=$1 AND active=true',
      [req.params.slug])).rows[0];
    if (!sub) return res.status(404).json({ error: 'Unknown subscription' });

    if (sub.secret) {
      const sig = req.headers['x-signature'] || req.headers['x-hub-signature-256'];
      const expected = 'sha256=' + crypto.createHmac('sha256', sub.secret)
        .update(JSON.stringify(req.body || {})).digest('hex');
      if (!sig || (sig !== expected && sig !== expected.slice(7))) {
        return res.status(401).json({ error: 'Bad signature' });
      }
    }

    const payload = req.body || {};
    const eventType = payload.event_type || payload.type || req.headers['x-event'] || 'unknown';

    const ins = await pool.query(
      `INSERT INTO webhook_deliveries (subscription_slug, event_type, headers, payload, status)
       VALUES ($1,$2,$3,$4,'received') RETURNING id`,
      [sub.slug, eventType, req.headers, payload]
    );

    // Promote into events table for downstream pipelines.
    await pool.query(
      `INSERT INTO events (event_type, title, description, payload, severity, status)
       VALUES ($1,$2,$3,$4,$5,'new')`,
      [`webhook.${sub.vendor || sub.slug}.${eventType}`.slice(0, 100),
       (payload.title || payload.summary || `${sub.vendor || sub.slug} webhook`).toString().slice(0, 255),
       (payload.description || `Webhook delivery ${ins.rows[0].id}`).toString(),
       payload, 'info']
    );
    res.status(202).json({ delivery_id: ins.rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// All other endpoints are JWT-protected.
router.use(verifyToken);

router.get('/subscriptions', async (_req, res) => {
  try {
    await ensureTables();
    const r = await pool.query(
      `SELECT id, slug, vendor, description, active, created_at,
              CASE WHEN secret IS NOT NULL AND secret <> '' THEN true ELSE false END AS has_secret
       FROM webhook_subscriptions ORDER BY active DESC, slug`);
    res.json({ subscriptions: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/subscriptions', async (req, res) => {
  try {
    await ensureTables();
    const b = req.body || {};
    if (!b.slug) return res.status(400).json({ error: 'slug required' });
    const secret = b.secret || crypto.randomBytes(16).toString('hex');
    const r = await pool.query(
      `INSERT INTO webhook_subscriptions (slug, vendor, description, secret, active)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (slug) DO UPDATE SET vendor=$2, description=$3, active=$5 RETURNING *`,
      [b.slug, b.vendor || null, b.description || null, secret, b.active === false ? false : true]
    );
    res.status(201).json({ subscription: r.rows[0], ingest_url: `/api/gap-nonai-webhook-ingest/in/${b.slug}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/subscriptions/:slug', async (req, res) => {
  try {
    await ensureTables();
    await pool.query('DELETE FROM webhook_subscriptions WHERE slug=$1', [req.params.slug]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/deliveries', async (req, res) => {
  try {
    await ensureTables();
    const { subscription_slug, status, limit } = req.query;
    const where = []; const args = [];
    if (subscription_slug) { args.push(subscription_slug); where.push(`subscription_slug=$${args.length}`); }
    if (status)            { args.push(status); where.push(`status=$${args.length}`); }
    args.push(Math.min(parseInt(limit) || 50, 200));
    const sql = `SELECT id, subscription_slug, event_type, status, received_at
                 FROM webhook_deliveries
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY received_at DESC LIMIT $${args.length}`;
    const r = await pool.query(sql, args);
    res.json({ deliveries: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/deliveries/:id', async (req, res) => {
  try {
    await ensureTables();
    const r = await pool.query('SELECT * FROM webhook_deliveries WHERE id=$1', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ delivery: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
