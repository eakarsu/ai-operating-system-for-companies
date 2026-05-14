const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM data_sources ORDER BY name');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM data_sources WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, type, connection_string, sync_frequency, status, last_synced_at, record_count, description, owner, tags } = req.body;
    const result = await db.query(
      'INSERT INTO data_sources (name, type, connection_string, sync_frequency, status, last_synced_at, record_count, description, owner, tags) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [name, type, connection_string, sync_frequency||'hourly', status||'active', last_synced_at, record_count, description, owner, tags]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, type, connection_string, sync_frequency, status, last_synced_at, record_count, description, owner, tags } = req.body;
    const result = await db.query(
      'UPDATE data_sources SET name=$1, type=$2, connection_string=$3, sync_frequency=$4, status=$5, last_synced_at=$6, record_count=$7, description=$8, owner=$9, tags=$10 WHERE id=$11 RETURNING *',
      [name, type, connection_string, sync_frequency, status, last_synced_at, record_count, description, owner, tags, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM data_sources WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
