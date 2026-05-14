const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/dashboard/stats — KPI cards + recent activity for the landing page
router.get('/stats', auth, async (req, res) => {
  try {
    const [sources, eventsToday, openInsights, activeAnomalies, avgHealth, recentActivity] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS c FROM data_sources'),
      db.query("SELECT COUNT(*)::int AS c FROM events WHERE occurred_at >= NOW() - INTERVAL '24 hours'"),
      db.query("SELECT COUNT(*)::int AS c FROM insights WHERE status IN ('new','open','in_progress','reviewing')"),
      db.query("SELECT COUNT(*)::int AS c FROM anomalies WHERE status = 'open'"),
      db.query('SELECT COALESCE(AVG(overall_score), 0)::float AS avg FROM health_scores'),
      db.query('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10'),
    ]);

    res.json({
      kpis: {
        data_sources: sources.rows[0].c,
        events_today: eventsToday.rows[0].c,
        open_insights: openInsights.rows[0].c,
        active_anomalies: activeAnomalies.rows[0].c,
        avg_health_score: Math.round((avgHealth.rows[0].avg || 0) * 10) / 10,
      },
      recent_activity: recentActivity.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
