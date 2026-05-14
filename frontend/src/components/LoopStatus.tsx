const openLoops = [
  {
    title: '3 deals at churn risk — no outreach yet',
    category: 'Sales',
    daysOpen: 3,
    lastActivity: 'AI flagged churn signals, assigned to CS team',
    severity: 'critical',
  },
  {
    title: 'SSO integration blocked by vendor API',
    category: 'Engineering',
    daysOpen: 4,
    lastActivity: 'Support ticket filed with vendor (no response)',
    severity: 'high',
  },
  {
    title: 'Bulk export feature 2 weeks behind schedule',
    category: 'Product',
    daysOpen: 6,
    lastActivity: 'Data pipeline refactor PR opened by @jsmith',
    severity: 'high',
  },
  {
    title: 'EKS autoscaler misconfiguration — cost leaking',
    category: 'Ops',
    daysOpen: 1,
    lastActivity: 'Ticket created, @devops-lead assigned',
    severity: 'critical',
  },
  {
    title: 'Deployment CI pipeline slowdown unresolved',
    category: 'Engineering',
    daysOpen: 5,
    lastActivity: 'Nx team contacted, awaiting guidance',
    severity: 'medium',
  },
]

const closedLoops = [
  {
    title: 'Dashboard feature launch coordination',
    category: 'Product',
    resolvedIn: '2d',
    resolution: 'Launched successfully, exceeded adoption forecast',
    closedAt: '2d ago',
  },
  {
    title: 'Q1 headcount plan finalization',
    category: 'Ops',
    resolvedIn: '5d',
    resolution: 'Board approved updated headcount +2 engineers',
    closedAt: '1w ago',
  },
  {
    title: 'Security audit follow-up tasks',
    category: 'Engineering',
    resolvedIn: '8d',
    resolution: 'All 7 critical findings remediated, audit closed',
    closedAt: '1w ago',
  },
  {
    title: 'Q2 pricing update rollout',
    category: 'Sales',
    resolvedIn: '3d',
    resolution: 'New pricing communicated to all active accounts',
    closedAt: '2w ago',
  },
]

const severityColor: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

const categoryColor: Record<string, string> = {
  Sales: 'bg-green-100 text-green-700',
  Engineering: 'bg-blue-100 text-blue-700',
  Product: 'bg-purple-100 text-purple-700',
  Ops: 'bg-orange-100 text-orange-700',
}

export default function LoopStatus() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Loop Status</h2>
        <p className="text-sm text-gray-500">Track open issues and recently resolved items</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-black text-red-600">{openLoops.length}</div>
          <div className="text-xs text-gray-500 mt-1">Open Loops</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-black text-orange-500">{openLoops.filter(l => l.severity === 'critical').length}</div>
          <div className="text-xs text-gray-500 mt-1">Critical</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-black text-green-600">{closedLoops.length}</div>
          <div className="text-xs text-gray-500 mt-1">Closed (30d)</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-black text-violet-600">4.5d</div>
          <div className="text-xs text-gray-500 mt-1">Avg Resolution</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Open loops */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Open Loops
          </h3>
          <div className="space-y-2">
            {openLoops.map((loop, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs border px-2 py-0.5 rounded font-medium ${severityColor[loop.severity]}`}>
                      {loop.severity}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor[loop.category]}`}>
                      {loop.category}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{loop.daysOpen}d open</span>
                </div>
                <div className="text-sm font-medium text-gray-800 mb-1">{loop.title}</div>
                <div className="text-xs text-gray-500">{loop.lastActivity}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Closed loops */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Recently Closed
          </h3>
          <div className="space-y-2">
            {closedLoops.map((loop, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 opacity-90">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Resolved</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor[loop.category]}`}>
                      {loop.category}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{loop.closedAt}</span>
                </div>
                <div className="text-sm font-medium text-gray-700 mb-1">{loop.title}</div>
                <div className="text-xs text-gray-500 mb-1">{loop.resolution}</div>
                <div className="text-xs text-green-600 font-medium">Resolved in {loop.resolvedIn}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
