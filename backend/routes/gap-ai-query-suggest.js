// Next-Best Query Suggester — mines the saved_queries history + recent
// anomalies/insights to propose 5 follow-up questions an operator might
// want to ask. Deterministic fallback when no OPENROUTER_API_KEY; uses
// LLM to rerank/rewrite when the key is set. Either way, results are
// persisted to query_suggestions for later analysis.
// Tables: query_suggestions, reads from saved_queries/anomalies/insights.

const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');

router.use(verifyToken);

async function ensureTables() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS query_suggestions (
      id SERIAL PRIMARY KEY,
      context TEXT,
      suggestions JSONB,
      picked_index INTEGER,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch (e) { /* swallow */ }
}

async function callAI(systemPrompt, userPrompt) {
  if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY.startsWith('sk-or-placeholder')) return null;
  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost',
        'X-Title': 'Query Suggester'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt }
        ]
      })
    });
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (e) { return null; }
}

router.post('/suggest', async (req, res) => {
  try {
    await ensureTables();
    const { context, limit } = req.body || {};
    const ctx = (context || '').toString();
    const n = Math.min(parseInt(limit) || 5, 10);

    // Pull recent signal context
    const saved   = (await pool.query(`SELECT name, query_text FROM saved_queries ORDER BY last_run_at DESC NULLS LAST, created_at DESC LIMIT 8`)).rows;
    const anoms   = (await pool.query(`SELECT metric_name, deviation_pct, severity FROM anomalies WHERE status='open' ORDER BY detected_at DESC LIMIT 5`)).rows;
    const insights= (await pool.query(`SELECT title, category FROM insights ORDER BY created_at DESC LIMIT 5`)).rows;

    // Deterministic seeds derived from real data
    const seeds = [];
    for (const a of anoms) {
      seeds.push(`What caused the ${a.metric_name} anomaly (${a.deviation_pct}%) and which sources correlated?`);
    }
    for (const i of insights) {
      seeds.push(`Which departments are most affected by "${i.title}" and what's the trend?`);
    }
    for (const s of saved) {
      seeds.push(`Re-run "${s.name}" filtered to the last 7 days and compare to the previous period.`);
    }
    // Generic fallbacks
    seeds.push('Which KPIs missed target this period and which workflows touched them?');
    seeds.push('Top 5 connector errors in the last 24h, grouped by vendor.');
    seeds.push('Which closed-loop tickets resolved without moving their target KPI?');

    let suggestions = Array.from(new Set(seeds)).slice(0, n);
    let llm_used = false;

    if (process.env.OPENROUTER_API_KEY) {
      const sys = `You suggest the next-best analytics questions for a CompanyOS operator. Return STRICT JSON: {"suggestions":["...","..."]}. Exactly ${n} items. Concrete, answerable, reference real entities given.`;
      const usr = `OPERATOR CONTEXT: ${ctx || '(none)'}\n\nRECENT ANOMALIES: ${JSON.stringify(anoms)}\nRECENT INSIGHTS: ${JSON.stringify(insights)}\nSAVED QUERIES: ${JSON.stringify(saved)}\nSEED IDEAS:\n${seeds.slice(0,8).map((s,i)=>`${i+1}. ${s}`).join('\n')}`;
      const raw = await callAI(sys, usr);
      if (raw) {
        try {
          const m = raw.match(/\{[\s\S]*\}/);
          if (m) {
            const parsed = JSON.parse(m[0]);
            if (Array.isArray(parsed.suggestions) && parsed.suggestions.length) {
              suggestions = parsed.suggestions.slice(0, n).map(String);
              llm_used = true;
            }
          }
        } catch { /* keep deterministic */ }
      }
    }

    const ins = await pool.query(
      `INSERT INTO query_suggestions (context, suggestions) VALUES ($1,$2) RETURNING id, created_at`,
      [ctx, JSON.stringify(suggestions)]
    );
    res.json({ id: ins.rows[0].id, suggestions, llm_used, sources: { anomalies: anoms.length, insights: insights.length, saved_queries: saved.length } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/pick', async (req, res) => {
  try {
    await ensureTables();
    const { picked_index } = req.body || {};
    if (typeof picked_index !== 'number') return res.status(400).json({ error: 'picked_index (number) required' });
    const r = await pool.query(`UPDATE query_suggestions SET picked_index=$1 WHERE id=$2 RETURNING *`, [picked_index, req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ suggestion: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/recent', async (req, res) => {
  try {
    await ensureTables();
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const r = await pool.query('SELECT * FROM query_suggestions ORDER BY created_at DESC LIMIT $1', [limit]);
    res.json({ recent: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
