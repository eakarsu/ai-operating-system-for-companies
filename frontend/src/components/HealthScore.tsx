const departments = [
  { name: 'Operations', score: 85, change: '+3', color: 'bg-violet-500' },
  { name: 'Engineering', score: 82, change: '-5', color: 'bg-blue-500' },
  { name: 'Product', score: 71, change: '-8', color: 'bg-indigo-500' },
  { name: 'Sales', score: 68, change: '+2', color: 'bg-purple-500' },
]

const positiveDrivers = [
  'Q2 hiring ahead of plan (+2 wks)',
  'Dashboard feature 68% above adoption forecast',
  'Enterprise deal size increased $13K avg',
  'Ops cost control improved vs Q1',
]

const negativeDrivers = [
  'Sprint velocity down 23% this week',
  'Deployment frequency below target (3 vs 7)',
  '3 deals at churn risk this quarter',
  'Infrastructure costs $12K over budget',
]

// Sparkline data (relative values)
const sparklineData = [72, 74, 71, 75, 78, 76, 79]

export default function HealthScore() {
  const score = 79
  const circumference = 2 * Math.PI * 54
  const strokeDash = (score / 100) * circumference

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Company Health Score</h2>
        <p className="text-sm text-gray-500">Composite AI-calculated health metric across all departments</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Big Score */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center">
          <div className="relative w-36 h-36 mb-4">
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#f3f4f6" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke="#7c3aed"
                strokeWidth="10"
                strokeDasharray={`${strokeDash} ${circumference}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-gray-900">{score}</span>
              <span className="text-xs text-gray-400 font-medium">/100</span>
            </div>
          </div>
          <div className="text-sm font-semibold text-violet-600">Good</div>
          <div className="text-xs text-gray-400 mt-1">Updated 15 min ago</div>

          {/* Sparkline */}
          <div className="mt-4 w-full">
            <div className="text-xs text-gray-400 mb-2 text-center">7-day trend</div>
            <div className="flex items-end gap-1 h-8 justify-center">
              {sparklineData.map((v, i) => {
                const h = ((v - 65) / 20) * 100
                return (
                  <div
                    key={i}
                    className={`w-4 rounded-sm ${i === sparklineData.length - 1 ? 'bg-violet-500' : 'bg-violet-200'}`}
                    style={{ height: `${Math.max(10, h)}%` }}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Department Breakdown</h3>
          <div className="space-y-4">
            {departments.map(d => (
              <div key={d.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{d.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-medium ${d.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{d.change}</span>
                    <span className="text-sm font-bold text-gray-900">{d.score}%</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${d.color}`} style={{ width: `${d.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Drivers */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Key Drivers</h3>
          <div className="mb-4">
            <div className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1">
              <span>▲</span> Positive
            </div>
            <ul className="space-y-2">
              {positiveDrivers.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold text-red-500 mb-2 flex items-center gap-1">
              <span>▼</span> Dragging
            </div>
            <ul className="space-y-2">
              {negativeDrivers.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
