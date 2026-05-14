const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// List activity log with optional filtering
router.get('/', auth, async (req, res) => {
  try {
    const { entity_type, entity_id, action, limit } = req.query;
    const conditions = [];
    const params = [];
    if (entity_type) { params.push(entity_type); conditions.push(`entity_type = $${params.length}`); }
    if (entity_id) { params.push(Number(entity_id)); conditions.push(`entity_id = $${params.length}`); }
    if (action) { params.push(action); conditions.push(`action = $${params.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const lim = Math.min(Number(limit) || 200, 1000);
    const result = await db.query(`SELECT * FROM activity_log ${where} ORDER BY created_at DESC LIMIT ${lim}`, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create a new activity entry (manual logging endpoint)
router.post('/', auth, async (req, res) => {
  try {
    const { action, entity_type, entity_id, description, metadata } = req.body;
    if (!action) return res.status(400).json({ error: 'action is required' });
    const userEmail = req.user?.email || null;
    const result = await db.query(
      'INSERT INTO activity_log (user_email, action, entity_type, entity_id, description, metadata) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [userEmail, action, entity_type || null, entity_id || null, description || null, metadata ? JSON.stringify(metadata) : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM activity_log WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
