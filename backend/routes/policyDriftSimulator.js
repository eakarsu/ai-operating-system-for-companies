const express = require('express');
const router = express.Router();

function scoreItem(item) {
  const owner = String(item.owner || 'unassigned');
  const policy = String(item.policy || item.rule || 'Untitled policy');
  const current = Number(item.current_value ?? item.current ?? 0);
  const target = Number(item.target_value ?? item.target ?? 100);
  const tolerance = Number(item.tolerance ?? 10);
  const ageDays = Number(item.age_days ?? item.days_since_review ?? 0);
  const criticality = String(item.criticality || 'medium').toLowerCase();
  const drift = Math.abs(current - target);
  const ageRisk = Math.min(30, Math.round(ageDays / 6));
  const criticalityRisk = { low: 4, medium: 12, high: 22, critical: 32 }[criticality] || 12;
  const score = Math.min(100, Math.round(drift * 1.4 + Math.max(0, drift - tolerance) * 1.8 + ageRisk + criticalityRisk));
  const severity = score >= 75 ? 'critical' : score >= 55 ? 'high' : score >= 35 ? 'medium' : 'low';
  const action = score >= 75
    ? 'Freeze dependent workflow changes and run owner attestation.'
    : score >= 55
      ? 'Open a policy exception review with evidence from the source system.'
      : score >= 35
        ? 'Schedule owner review before the next operating cadence.'
        : 'Keep monitoring in the normal policy cycle.';
  return { policy, owner, drift, tolerance, ageDays, criticality, score, severity, action };
}

router.post('/simulate', (req, res) => {
  const policies = Array.isArray(req.body?.policies) ? req.body.policies : [];
  const scored = policies.length ? policies.map(scoreItem) : [
    scoreItem({ policy: 'Vendor onboarding SLA', owner: 'Procurement Ops', current: 64, target: 90, tolerance: 8, age_days: 52, criticality: 'high' }),
    scoreItem({ policy: 'Customer escalation ownership', owner: 'Support', current: 82, target: 95, tolerance: 6, age_days: 18, criticality: 'medium' }),
    scoreItem({ policy: 'Quarterly access recertification', owner: 'IT Governance', current: 71, target: 100, tolerance: 4, age_days: 83, criticality: 'critical' }),
  ];
  const average = Math.round(scored.reduce((sum, item) => sum + item.score, 0) / scored.length);
  res.json({
    averageRisk: average,
    policyCount: scored.length,
    escalationCount: scored.filter((item) => item.score >= 55).length,
    simulatedAt: new Date().toISOString(),
    policies: scored.sort((a, b) => b.score - a.score),
  });
});

module.exports = router;
