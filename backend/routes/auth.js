const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const verifyToken = require('../middleware/auth');

router.post('/login', async (req, res) => {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || !process.env.JWT_ISSUER || !process.env.JWT_AUDIENCE) return res.status(503).json({ error: 'Authentication is not configured' });
    const { email, password } = req.body;
    if (typeof email !== 'string' || email.length > 254 || typeof password !== 'string' || password.length < 8 || password.length > 200) return res.status(400).json({ error: 'Invalid login request' });
    let result = await db.query('SELECT id,email,password_hash,display_name AS name,role,tenant_id FROM company_identities WHERE lower(email)=lower($1) AND active=TRUE', [email]);
    if (!result.rows.length && process.env.ENABLE_GENERATED_FEATURES === 'true' && process.env.NODE_ENV !== 'production' && process.env.DEFAULT_TENANT_ID) result = await db.query('SELECT id,email,password_hash,name,role,$2::text AS tenant_id FROM users WHERE lower(email)=lower($1)', [email, process.env.DEFAULT_TENANT_ID]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenant_id }, process.env.JWT_SECRET, { algorithm: 'HS256', issuer: process.env.JWT_ISSUER, audience: process.env.JWT_AUDIENCE, expiresIn: '8h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenant_id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id,email,display_name AS name,role,tenant_id FROM company_identities WHERE id=$1 AND tenant_id=$2 AND active=TRUE', [req.user.id, req.user.tenantId]);
    if (!result.rows[0]) return res.status(401).json({ error: 'Identity is not active' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
