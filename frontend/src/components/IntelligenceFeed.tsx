const insights = [
  {
    category: 'Engineering',
    severity: 'warning',
    title: 'Sprint velocity dropped 23% this week',
    summary: 'Team velocity fell from 47 to 36 story points. Pattern matches previous incidents caused by context-switching from support load.',
    evidence: [
      'Support tickets spiked 41% (Mon-Wed)',
      '4 engineers pulled into incident response on Tue',
      'Only 2 of 8 planned PR reviews completed on time',
    ],
    detectedAt: '15 min ago',
    source: 'GitHub + Linear',
  },
  {
    category: 'Sales',
    severity: 'critical',
    title: '3 deals at risk of churning this quarter',
    summary: 'Acme Corp, DataFlow Inc, and Vertex AI show behavioral churn signals: no login in 14+ days, dropped Slack activity, no executive engagement.',
    evidence: [
      'Acme Corp: Last login 18 days ago, contract renewal in 23 days',
      'DataFlow: CS ticket volume down 87% (usually high engagement)',
      'Vertex AI: Champion left company, no replacement contact identified',
    ],
    detectedAt: '1h ago',
    source: 'CRM + Slack',
  },
  {
    category: 'Engineering',
    severity: 'warning',
    title: 'Deployment frequency below target for 2nd week',
    summary: 'Team deployed 3x this week vs 7x target. CI pipeline p95 duration increased from 8 min to 23 min since the Nx migration.',
    evidence: [
      'Nx migration introduced 15-min affected-project detection step',
      'Deploy frequency: Week 1: 7, Week 2: 5, Week 3: 3',
      'Pipeline queue depth averaged 4 builds on Wednesday',
    ],
    detectedAt: '3h ago',
    source: 'GitHub',
  },
  {
    category: 'Product',
    severity: 'info',
    title: 'Feature adoption for v2.1 dashboard is 68% above forecast',
    summary: 'New analytics dashboard feature seeing 3.2x higher adoption than similar feature launches. Power user segment driving majority of engagement.',
    evidence: [
      '1,247 users activated dashboard in first 48h (forecast: 742)',
      'Average session time increased 4.1 min post-launch',
      'NPS from dashboard users: +47 vs product baseline +31',
    ],
    detectedAt: '4h ago',
    source: 'Notion + CRM',
  },
  {
    category: 'Ops',
    severity: 'info',
    title: 'Q2 hiring pace 2 weeks ahead of plan',
    summary: 'Engineering hiring moving faster than roadmap. 3 senior engineers accepted offers, 5 in final rounds. May exceed Q2 headcount budget.',
    evidence: [
      '3 offers accepted this week (plan: 1)',
      'Time-to-offer dropped from 28 to 19 days avg',
      'Projected Q2 headcount: 14 vs budget of 11',
    ],
    detectedAt: '6h ago',
    source: 'Calendar + Notion',
  },
  {
    category: 'Sales',
    severity: 'info',
    title: 'Enterprise pipeline health improved 18% MoM',
    summary: 'Outbound motion improvements and new case studies driving higher quality pipeline. Average deal size increased from $48K to $61K ARR.',
    evidence: [
      'MQL to SQL conversion: 12% → 19% this month',
      'Average deal size: $48K → $61K ARR',
      '2 new enterprise logos added to pipeline from referrals',
    ],
    detectedAt: '8h ago',
    source: 'CRM',
  },
  {
    category: 'Product',
    severity: 'warning',
    title: 'Q2 roadmap at risk: 2 features behind schedule',
    summary: 'Bulk export and SSO integration are 3+ weeks behind. Both had external dependencies that slipped. Q2 release may need scope adjustment.',
    evidence: [
      'Bulk export: blocked on data pipeline refactor (ETA pushed 2 weeks)',
      'SSO: third-party vendor API broke in upgrade (filed support ticket 4d ago)',
      'PM status docs not updated in 8 days — visibility gap',
    ],
    detectedAt: '1d ago',
    source: 'Linear + Notion',
  },
  {
    category: 'Ops',
    severity: 'critical',
    title: 'Infrastructure cost spike: $12K above budget in April',
    summary: 'AWS costs exceeded budget by 34%. Primary driver: EKS node over-provisioning after autoscaler config change in load test environment.',
    evidence: [
      'Load test environment left running for 11 days ($7.2K)',
      'EKS autoscaler min-nodes setting changed from 2 to 12',
      'Cost anomaly not flagged for 6 days due to alerting misconfiguration',
    ],
    detectedAt: '1d ago',
    source: 'Notion + Slack',
  },
]

const categoryColor: Record<string, string> = {
  Engineering: 'bg-blue-100 text-blue-700',
  Product: 'bg-purple-100 text-purple-700',
  Sales: 'bg-green-100 text-green-700',
  Ops: 'bg-orange-100 text-orange-700',
}

const severityDot: Record<string, string> = {
  info: 'bg-blue-400',
  warning: 'bg-yellow-400',
  critical: 'bg-red-500',
}

export default function IntelligenceFeed() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Intelligence Feed</h2>
          <p className="text-sm text-gray-500">AI-generated insights from connected data sources</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-xs text-violet-600 font-medium">Live analysis running</span>
        </div>
      </div>

      <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-auto pr-1">
        {insights.map((insight, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${severityDot[insight.severity]}`} />
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColor[insight.category]}`}>
                  {insight.category}
                </span>
                <span className="text-xs text-gray-400">{insight.source}</span>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{insight.detectedAt}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{insight.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{insight.summary}</p>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="text-xs font-semibold text-gray-500 mb-1.5">Evidence</div>
              <ul className="space-y-1">
                {insight.evidence.map((e, j) => (
                  <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-violet-400 mt-0.5 flex-shrink-0">•</span>
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
