// Custom Views for AI OS - Org Views
// 4 endpoints (2 VIZ + 2 NON-VIZ):
//   GET  /api/custom-views/process-activity      (VIZ)  - workflow run activity time series chart
//   GET  /api/custom-views/resource-utilization  (VIZ)  - heatmap of agent x department utilization
//   GET  /api/custom-views/org-chart-pdf         (NON)  - org chart export (PDF + JSON metadata)
//   GET  /api/custom-views/roles                 (NON)  - list roles + permissions
//   POST /api/custom-views/roles                 (NON)  - create role
//   PUT  /api/custom-views/roles/:id             (NON)  - update role
//   DELETE /api/custom-views/roles/:id           (NON)  - delete role

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

function safeRows(r) { return (r && r.rows) ? r.rows : []; }

// ---------- in-memory roles store (seeded) ----------
// We avoid mutating production schema; roles persist for the lifetime of the process.
const ROLES = [
  { id: 1, slug: 'admin',     name: 'Administrator',  description: 'Full access to all OS surfaces',         permissions: ['read:*', 'write:*', 'admin:*'] },
  { id: 2, slug: 'operator',  name: 'Operator',       description: 'Runs workflows, triages tickets',       permissions: ['read:*', 'write:workflows', 'write:tickets'] },
  { id: 3, slug: 'analyst',   name: 'Analyst',        description: 'Reads dashboards, runs queries',        permissions: ['read:dashboard', 'read:queries', 'read:insights'] },
  { id: 4, slug: 'auditor',   name: 'Auditor',        description: 'Read-only access for compliance',       permissions: ['read:*'] },
  { id: 5, slug: 'agent-bot', name: 'Agent (machine)', description: 'Programmatic agent identity',          permissions: ['read:events', 'write:events', 'write:agent_runs'] }
];
let ROLE_NEXT_ID = 6;

function findRole(id) { return ROLES.find(r => r.id === id); }
function findRoleIdx(id) { return ROLES.findIndex(r => r.id === id); }

// ---------- VIZ 1: process-activity chart ----------
// Returns time-bucketed counts of workflow_runs by status, suitable for stacked area/bar chart.
router.get('/process-activity', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 14, 60);
    const wfRuns = await pool.query(
      `SELECT wr.id, wr.workflow_id, wr.status, wr.started_at, wr.finished_at,
              wr.sla_breached, wr.amount_usd, w.name AS workflow_name, w.slug AS workflow_slug
         FROM workflow_runs wr
         LEFT JOIN workflows w ON w.id = wr.workflow_id
        WHERE wr.started_at >= NOW() - ($1::int * INTERVAL '1 day')
           OR wr.started_at IS NULL
        ORDER BY wr.started_at DESC NULLS LAST
        LIMIT 1000`, [days]);
    const rows = safeRows(wfRuns);

    const now = new Date();
    const bucketMs = 24 * 60 * 60 * 1000;
    const startMs = now.getTime() - days * bucketMs;
    const buckets = [];
    for (let i = 0; i < days; i++) {
      const ts = startMs + i * bucketMs;
      const d = new Date(ts);
      buckets.push({
        date: d.toISOString().slice(0, 10),
        ts_ms: ts,
        running: 0, succeeded: 0, failed: 0, blocked: 0, cancelled: 0,
        sla_breached: 0, total: 0
      });
    }
    function bucketIndex(t) {
      if (!t) return -1;
      const tms = new Date(t).getTime();
      const idx = Math.floor((tms - startMs) / bucketMs);
      return idx >= 0 && idx < buckets.length ? idx : -1;
    }
    const byWorkflow = {};
    rows.forEach(r => {
      const idx = bucketIndex(r.started_at);
      if (idx >= 0) {
        const b = buckets[idx];
        b.total += 1;
        if (b[r.status] !== undefined) b[r.status] += 1;
        if (r.sla_breached) b.sla_breached += 1;
      }
      const k = r.workflow_slug || `wf-${r.workflow_id}`;
      if (!byWorkflow[k]) byWorkflow[k] = { workflow_slug: k, workflow_name: r.workflow_name || k, runs: 0, succeeded: 0, failed: 0, total_amount_usd: 0 };
      byWorkflow[k].runs += 1;
      if (r.status === 'succeeded') byWorkflow[k].succeeded += 1;
      if (r.status === 'failed') byWorkflow[k].failed += 1;
      byWorkflow[k].total_amount_usd += Number(r.amount_usd || 0);
    });

    const totals = rows.reduce((acc, r) => {
      acc.total += 1;
      acc.by_status[r.status] = (acc.by_status[r.status] || 0) + 1;
      if (r.sla_breached) acc.sla_breached += 1;
      return acc;
    }, { total: 0, by_status: {}, sla_breached: 0 });

    res.json({
      window: { days, start_ms: startMs, end_ms: now.getTime() },
      buckets,
      by_workflow: Object.values(byWorkflow).sort((a, b) => b.runs - a.runs),
      totals
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- VIZ 2: resource-utilization heatmap ----------
// Returns 2D matrix: rows = agents, cols = departments, value = run count + tokens.
router.get('/resource-utilization', async (_req, res) => {
  try {
    const agents = await pool.query(
      `SELECT id, slug, name, department, model, active,
              cost_per_1k_tokens_cents, avg_latency_ms, success_rate_pct
         FROM agents
        ORDER BY slug`);
    const runs = await pool.query(
      `SELECT ar.agent_id, ar.status, ar.tokens_in, ar.tokens_out, ar.cost_cents,
              ar.steps_planned, ar.steps_completed, ar.started_at,
              a.slug AS agent_slug, a.department AS agent_dept,
              wr.workflow_id, w.departments AS wf_departments
         FROM agent_runs ar
         LEFT JOIN agents a ON a.id = ar.agent_id
         LEFT JOIN workflow_runs wr ON wr.id = ar.workflow_run_id
         LEFT JOIN workflows w ON w.id = wr.workflow_id`);
    const depts = await pool.query(
      `SELECT slug, name, headcount FROM departments ORDER BY slug`);

    const deptList = safeRows(depts);
    const deptSlugs = deptList.map(d => d.slug);
    // Ensure agent.department values are present even if not in departments table
    safeRows(agents).forEach(a => {
      if (a.department && !deptSlugs.includes(a.department)) {
        deptSlugs.push(a.department);
        deptList.push({ slug: a.department, name: a.department, headcount: 0 });
      }
    });
    if (deptSlugs.length === 0) {
      // Synthesize at least one column so the heatmap renders
      deptSlugs.push('general');
      deptList.push({ slug: 'general', name: 'General', headcount: 0 });
    }

    const cells = {}; // key = `${agent_slug}::${dept_slug}` -> { runs, tokens, cost_cents, success }
    function bump(agent_slug, dept_slug, r) {
      if (!agent_slug || !dept_slug) return;
      const k = `${agent_slug}::${dept_slug}`;
      if (!cells[k]) cells[k] = { agent_slug, dept_slug, runs: 0, tokens: 0, cost_cents: 0, success: 0, failed: 0 };
      const c = cells[k];
      c.runs += 1;
      c.tokens += (r.tokens_in || 0) + (r.tokens_out || 0);
      c.cost_cents += (r.cost_cents || 0);
      if (r.status === 'succeeded') c.success += 1;
      if (r.status === 'failed') c.failed += 1;
    }
    safeRows(runs).forEach(r => {
      const ag = r.agent_slug;
      // Map run to one or more departments
      let targets = [];
      if (r.wf_departments) {
        targets = r.wf_departments.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (!targets.length && r.agent_dept) targets = [r.agent_dept];
      if (!targets.length) targets = ['general'];
      targets.forEach(d => bump(ag, d, r));
    });

    const agentRows = safeRows(agents);
    const matrix = agentRows.map(a => {
      const row = { agent_slug: a.slug, agent_name: a.name, role: a.role, model: a.model, active: a.active, cells: [] };
      let agentTotal = 0;
      deptSlugs.forEach(d => {
        const c = cells[`${a.slug}::${d}`];
        const val = c ? c.runs : 0;
        agentTotal += val;
        row.cells.push({
          dept_slug: d,
          runs: c ? c.runs : 0,
          tokens: c ? c.tokens : 0,
          cost_cents: c ? c.cost_cents : 0,
          success: c ? c.success : 0,
          failed: c ? c.failed : 0
        });
      });
      row.total_runs = agentTotal;
      return row;
    });

    let maxRuns = 0;
    matrix.forEach(r => r.cells.forEach(c => { if (c.runs > maxRuns) maxRuns = c.runs; }));

    res.json({
      departments: deptList,
      agents: agentRows.map(a => ({ slug: a.slug, name: a.name, department: a.department, active: a.active })),
      matrix,
      max_cell_runs: maxRuns,
      totals: {
        agents: agentRows.length,
        departments: deptList.length,
        total_runs: matrix.reduce((a, r) => a + r.total_runs, 0)
      }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- NON-VIZ 1: org-chart PDF export ----------
// Returns a minimal valid PDF (base64) of the org chart, plus structured JSON for the UI.
router.get('/org-chart-pdf', async (_req, res) => {
  try {
    const depts = await pool.query(
      `SELECT id, slug, name, parent_id, head_email, headcount, charter, cost_center,
              primary_kpis, upstream_deps, downstream_deps
         FROM departments ORDER BY parent_id NULLS FIRST, slug`);
    const rows = safeRows(depts);

    // Build hierarchy
    const byId = {};
    rows.forEach(d => { byId[d.id] = { ...d, children: [] }; });
    const roots = [];
    rows.forEach(d => {
      if (d.parent_id && byId[d.parent_id]) byId[d.parent_id].children.push(byId[d.id]);
      else roots.push(byId[d.id]);
    });

    // Build a minimal PDF in pure JS (no external dep).
    // PDF 1.4, single page, Helvetica, lines of text for each department.
    const lines = [];
    lines.push('Org Chart - AI Operating System');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Departments: ${rows.length}`);
    lines.push('');
    function walk(node, depth) {
      const indent = '  '.repeat(depth);
      const headcount = node.headcount || 0;
      lines.push(`${indent}- ${node.name} [${node.slug}] (${headcount})`);
      if (node.head_email) lines.push(`${indent}  head: ${node.head_email}`);
      if (node.cost_center) lines.push(`${indent}  cost_center: ${node.cost_center}`);
      node.children.forEach(c => walk(c, depth + 1));
    }
    roots.forEach(r => walk(r, 0));

    // Compose PDF content stream
    function escapePdfText(s) {
      return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    }
    const fontSize = 10;
    const leading = 12;
    const startY = 800;
    let content = `BT\n/F1 ${fontSize} Tf\n${leading} TL\n50 ${startY} Td\n`;
    lines.forEach((ln, i) => {
      content += `(${escapePdfText(ln.slice(0, 110))}) Tj\nT*\n`;
    });
    content += 'ET';

    const objects = [];
    objects.push(`<< /Type /Catalog /Pages 2 0 R >>`);
    objects.push(`<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`);
    objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((body, i) => {
      offsets.push(Buffer.byteLength(pdf, 'utf8'));
      pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xrefOffset = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += `0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    const base64 = Buffer.from(pdf, 'utf8').toString('base64');

    res.json({
      filename: `org-chart-${new Date().toISOString().slice(0, 10)}.pdf`,
      mime: 'application/pdf',
      bytes: pdf.length,
      pdf_base64: base64,
      preview_lines: lines,
      hierarchy: roots,
      department_count: rows.length,
      total_headcount: rows.reduce((a, d) => a + (d.headcount || 0), 0)
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- NON-VIZ 2: role/permission editor (CRUD) ----------
router.get('/roles', (_req, res) => {
  try {
    res.json({
      roles: ROLES,
      permissions_catalog: [
        'read:*', 'write:*', 'admin:*',
        'read:dashboard', 'read:queries', 'read:insights', 'read:events',
        'write:workflows', 'write:tickets', 'write:events', 'write:agent_runs',
        'read:agents', 'write:agents', 'read:roles', 'write:roles'
      ],
      totals: { roles: ROLES.length }
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/roles', (req, res) => {
  try {
    const b = req.body || {};
    if (!b.slug || !b.name) return res.status(400).json({ error: 'slug and name required' });
    if (ROLES.some(r => r.slug === b.slug)) return res.status(409).json({ error: 'slug already exists' });
    const role = {
      id: ROLE_NEXT_ID++,
      slug: String(b.slug).trim(),
      name: String(b.name).trim(),
      description: b.description ? String(b.description) : '',
      permissions: Array.isArray(b.permissions) ? b.permissions.map(String) : []
    };
    ROLES.push(role);
    res.status(201).json({ role });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/roles/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const role = findRole(id);
    if (!role) return res.status(404).json({ error: 'role not found' });
    const b = req.body || {};
    if (b.name !== undefined) role.name = String(b.name);
    if (b.description !== undefined) role.description = String(b.description);
    if (b.permissions !== undefined) role.permissions = Array.isArray(b.permissions) ? b.permissions.map(String) : [];
    res.json({ role });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/roles/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const idx = findRoleIdx(id);
    if (idx === -1) return res.status(404).json({ error: 'role not found' });
    const [removed] = ROLES.splice(idx, 1);
    res.json({ deleted: removed });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
