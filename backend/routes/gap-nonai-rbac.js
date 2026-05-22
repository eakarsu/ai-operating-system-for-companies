// Role-Based Access Control — real RBAC management.
// Operators define roles + permissions, then assign roles to user emails.
// Tables: roles, user_roles (see schema.sql).
// All endpoints JWT-protected.

const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');

router.use(verifyToken);

async function ensureTables() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS roles (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(60) UNIQUE NOT NULL,
      name VARCHAR(120) NOT NULL,
      description TEXT,
      permissions TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS user_roles (
      id SERIAL PRIMARY KEY,
      user_email VARCHAR(255) NOT NULL,
      role_slug VARCHAR(60) NOT NULL,
      granted_by VARCHAR(255),
      granted_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch (e) { /* swallow */ }
}

// List all roles
router.get('/roles', async (_req, res) => {
  try {
    await ensureTables();
    const r = await pool.query('SELECT * FROM roles ORDER BY slug');
    res.json({ roles: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create role
router.post('/roles', async (req, res) => {
  try {
    await ensureTables();
    const { slug, name, description, permissions } = req.body || {};
    if (!slug || !name) return res.status(400).json({ error: 'slug and name required' });
    const r = await pool.query(
      `INSERT INTO roles (slug, name, description, permissions) VALUES ($1,$2,$3,$4)
       ON CONFLICT (slug) DO UPDATE SET name=$2, description=$3, permissions=$4 RETURNING *`,
      [slug, name, description || null, Array.isArray(permissions) ? permissions.join(',') : (permissions || '')]
    );
    res.status(201).json({ role: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/roles/:slug', async (req, res) => {
  try {
    await ensureTables();
    await pool.query('DELETE FROM user_roles WHERE role_slug=$1', [req.params.slug]);
    await pool.query('DELETE FROM roles WHERE slug=$1', [req.params.slug]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// List user-role assignments
router.get('/assignments', async (req, res) => {
  try {
    await ensureTables();
    const { user_email, role_slug } = req.query;
    const where = []; const args = [];
    if (user_email) { args.push(user_email); where.push(`user_email=$${args.length}`); }
    if (role_slug)  { args.push(role_slug);  where.push(`role_slug=$${args.length}`); }
    const sql = `SELECT ur.*, r.name AS role_name, r.permissions
                 FROM user_roles ur LEFT JOIN roles r ON r.slug=ur.role_slug
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY granted_at DESC`;
    const r = await pool.query(sql, args);
    res.json({ assignments: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Grant role to user
router.post('/assignments', async (req, res) => {
  try {
    await ensureTables();
    const { user_email, role_slug } = req.body || {};
    if (!user_email || !role_slug) return res.status(400).json({ error: 'user_email and role_slug required' });
    const r = await pool.query(
      `INSERT INTO user_roles (user_email, role_slug, granted_by) VALUES ($1,$2,$3) RETURNING *`,
      [user_email, role_slug, req.user?.email || null]
    );
    res.status(201).json({ assignment: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/assignments/:id', async (req, res) => {
  try {
    await ensureTables();
    await pool.query('DELETE FROM user_roles WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Resolve effective permissions for a user_email (union across assigned roles)
router.get('/effective/:email', async (req, res) => {
  try {
    await ensureTables();
    const r = await pool.query(`
      SELECT r.slug, r.name, r.permissions FROM user_roles ur
      JOIN roles r ON r.slug=ur.role_slug WHERE ur.user_email=$1`, [req.params.email]);
    const permSet = new Set();
    for (const row of r.rows) {
      (row.permissions || '').split(',').map(s => s.trim()).filter(Boolean).forEach(p => permSet.add(p));
    }
    res.json({ email: req.params.email, roles: r.rows, permissions: Array.from(permSet) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
