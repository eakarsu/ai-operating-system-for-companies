import { useState } from 'react'

const anomalies = [
  {
    type: 'drop',
    metric: 'Sprint Velocity',
    current: '36 pts',
    expected: '47 pts',
    deviation: -23.4,
    severity: 'high',
    firstDetected: '2h ago',
    events: [
      'Support ticket volume spiked 41% Mon-Wed',
      '4 engineers pulled into P0 incident on Tuesday',
      'Only 2 of 8 PR reviews completed this sprint',
      'Standup duration increased from 12 to 28 min avg',
    ],
  },
  {
    type: 'spike',
    metric: 'Infrastructure Cost (Daily)',
    current: '$2,847',
    expected: '$842',
    deviation: +238.1,
    severity: 'critical',
    firstDetected: '1d ago',
    events: [
      'EKS min-nodes changed from 2 to 12 in load test env',
      'Load test environment not torn down after test completed',
      'Cost alerting misconfigured — no alert fired for 6 days',
    ],
  },
  {
    type: 'pattern_break',
    metric: 'Deployment Frequency',
    current: '3 deploys/wk',
    expected: '7 deploys/wk',
    deviation: -57.1,
    severity: 'high',
    firstDetected: '5d ago',
    events: [
      'CI pipeline p95 duration: 8 min → 23 min post-Nx migration',
      'Nx affected-project detection adds 15 min per run',
      'Developers serializing deploys to avoid queue buildup',
    ],
  },
  {
    type: 'absence',
    metric: 'Executive Engagement (Vertex AI)',
    current: '0 touchpoints',
    expected: '2-3/month',
    deviation: -100,
    severity: 'critical',
    firstDetected: '3d ago',
    events: [
      'Champion (Sarah M.) left Vertex AI 12 days ago',
      'No executive sponsor identified as replacement',
      'Contract renewal due in 34 days',
    ],
  },
  {
    type: 'spike',
    metric: 'Dashboard Feature Adoption',
    current: '1,247 users/48h',
    expected: '742 users/48h',
    deviation: +68.1,
    severity: 'low',
    firstDetected: '2d ago',
    events: [
      'New analytics dashboard launched with guided onboarding',
      'Power user segment (top 20%) adopted at 4.1x baseline',
      'Avg session time increased 4.1 min across activated users',
    ],
  },
]

const typeLabel: Record<string, string> = {
  spike: 'Spike',
  drop: 'Drop',
  pattern_break: 'Pattern Break',
  absence: 'Absence',
}

const typeColor: Record<string, string> = {
  spike: 'bg-orange-100 text-orange-700',
  drop: 'bg-red-100 text-red-700',
  pattern_break: 'bg-purple-100 text-purple-700',
  absence: 'bg-gray-100 text-gray-700',
}

const severityBadge: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-green-100 text-green-700 border-green-200',
}

export default function AnomalyDetector() {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Anomaly Detector</h2>
        <p className="text-sm text-gray-500">Automated detection of statistical deviations and pattern breaks</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Metric</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Current</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expected</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deviation</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Severity</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Detected</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {anomalies.map((a, i) => (
              <>
                <tr
                  key={i}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setExpanded(expanded === i ? null : i)}
                >
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[a.type]}`}>
                      {typeLabel[a.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-800">{a.metric}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700 font-mono">{a.current}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-500 font-mono">{a.expected}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${a.deviation < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {a.deviation > 0 ? '+' : ''}{a.deviation.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs border px-2 py-0.5 rounded font-medium ${severityBadge[a.severity]}`}>
                      {a.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-400">{a.firstDetected}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400 text-xs">{expanded === i ? '▲' : '▼'}</span>
                  </td>
                </tr>
                {expanded === i && (
                  <tr key={`expanded-${i}`}>
                    <td colSpan={8} className="px-4 pb-4 bg-violet-50">
                      <div className="pt-3">
                        <div className="text-xs font-semibold text-violet-700 mb-2">Supporting Events</div>
                        <ul className="space-y-1.5">
                          {a.events.map((e, j) => (
                            <li key={j} className="flex items-start gap-2 text-xs text-gray-600">
                              <span className="text-violet-400 mt-0.5 flex-shrink-0">→</span>
                              {e}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
