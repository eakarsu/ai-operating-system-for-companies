import { useState } from 'react'

const exampleQueries = [
  "Why did velocity drop?",
  "What's blocking the Q2 release?",
  "Show deal pipeline health",
  "What caused the cost spike?",
  "Which team needs attention?",
]

const mockAnswers: Record<string, { answer: string; events: { source: string; content: string; ts: string }[] }> = {
  "Why did velocity drop?": {
    answer: "Sprint velocity dropped 23% (47→36 pts) this week primarily due to two compounding factors: (1) a P0 support incident on Tuesday pulled 4 engineers off sprint work for ~1.5 days, and (2) a spike in support ticket volume (+41%) created ongoing context-switching throughout the week. Only 2 of 8 planned PR reviews completed on schedule, further slowing feature completion.",
    events: [
      { source: 'Linear', content: 'Sprint #42 velocity: 36 pts (target: 47)', ts: 'Today 9:14am' },
      { source: 'Slack #incidents', content: 'P0 incident opened at 10:23am Tue — 4 engineers assigned', ts: 'Tue 10:23am' },
      { source: 'GitHub', content: 'PR review queue: 6 open reviews, avg wait 2.3 days', ts: 'Today 8:01am' },
      { source: 'Slack #support', content: 'Support tickets Mon-Wed: 147 (vs 104 prior week)', ts: 'Wed 5:00pm' },
    ],
  },
  "What's blocking the Q2 release?": {
    answer: "Two features are blocking the Q2 release: (1) Bulk Export is stuck on the data pipeline refactor, which slipped 2 weeks due to unexpected schema complexity. (2) SSO Integration has been blocked for 4 days by a third-party vendor API breaking change. Combined, these push the release window by approximately 3-4 weeks unless scope is adjusted.",
    events: [
      { source: 'Linear ENG-1847', content: 'Bulk Export: blocked — data pipeline refactor ETA pushed 2 wks', ts: 'Yesterday' },
      { source: 'Linear ENG-1923', content: 'SSO Integration: vendor API broken, support ticket #4821 open', ts: '4d ago' },
      { source: 'Notion', content: 'Q2 Roadmap doc last updated 8 days ago', ts: '8d ago' },
    ],
  },
  "Show deal pipeline health": {
    answer: "Enterprise pipeline improved 18% MoM with average deal size up to $61K ARR. However, 3 deals show significant churn risk: Acme Corp (renewal in 23 days, no login in 18 days), DataFlow Inc (engagement dropped 87%), and Vertex AI (champion left, no replacement). Total pipeline at risk: ~$193K ARR.",
    events: [
      { source: 'CRM', content: 'Acme Corp: 18 days no login, renewal Jun 2', ts: 'Today' },
      { source: 'CRM', content: 'DataFlow Inc: Support tickets dropped 87% (unusual)', ts: 'Yesterday' },
      { source: 'Slack', content: 'Sarah M. at Vertex AI announced departure', ts: '12d ago' },
      { source: 'CRM', content: 'Pipeline total: $2.4M, avg deal $61K (+27% MoM)', ts: 'Today' },
    ],
  },
  "What caused the cost spike?": {
    answer: "AWS costs exceeded budget by $12K in April (34% over). The primary cause was an EKS autoscaler misconfiguration: min-nodes was changed from 2 to 12 in the load testing environment, which was then left running for 11 days. A secondary alerting misconfiguration meant no notification fired for 6 days, allowing the issue to compound.",
    events: [
      { source: 'AWS Cost Explorer', content: 'April total: $47.2K (budget $35K)', ts: 'May 1' },
      { source: 'GitHub', content: 'Commit: change EKS min-nodes 2→12 for load test', ts: 'Apr 19' },
      { source: 'Slack #infra', content: 'Load test completed — environment not torn down', ts: 'Apr 20' },
    ],
  },
  "Which team needs attention?": {
    answer: "Sales (score: 68) and Product (score: 71) need the most attention. Sales has 3 deals at churn risk totaling ~$193K ARR. Product has 2 features behind schedule blocking the Q2 release. Engineering velocity is down but has a clear root cause (incident load) and should self-correct. Recommended actions: immediate executive outreach for at-risk accounts, PM sync to reassess Q2 scope.",
    events: [
      { source: 'CompanyOS', content: 'Sales health score: 68/100 (-5 pts this week)', ts: 'Today' },
      { source: 'CompanyOS', content: 'Product health score: 71/100 (-8 pts this week)', ts: 'Today' },
      { source: 'CRM', content: '3 accounts showing churn signals simultaneously', ts: 'Today' },
    ],
  },
}

export default function QueryInterface() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<null | typeof mockAnswers[string]>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (q: string) => {
    setLoading(true)
    setResult(null)
    setTimeout(() => {
      const answer = mockAnswers[q] || {
        answer: `Analysis of "${q}": Based on current data across all connected sources, I found relevant signals in Linear, Slack, and CRM. Detailed synthesis requires reviewing the intelligence feed for recent anomalies and trend data.`,
        events: [
          { source: 'CompanyOS', content: 'Query processed across 6 connected sources', ts: 'Just now' },
        ],
      }
      setResult(answer)
      setLoading(false)
    }, 800)
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Natural Language Query</h2>
        <p className="text-sm text-gray-500">Ask anything about your company — CompanyOS synthesizes an answer from all connected sources</p>
      </div>

      {/* Input */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && query.trim() && handleSubmit(query)}
            placeholder="Ask a question about your company..."
            className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
          <button
            onClick={() => query.trim() && handleSubmit(query)}
            className="bg-violet-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors"
          >
            Ask
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {exampleQueries.map(q => (
            <button
              key={q}
              onClick={() => { setQuery(q); handleSubmit(q) }}
              className="text-xs bg-violet-50 text-violet-700 border border-violet-200 px-3 py-1 rounded-full hover:bg-violet-100 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-violet-600">
            <div className="w-4 h-4 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Analyzing across all sources...</span>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-violet-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center text-white text-xs font-bold">AI</div>
              <span className="text-sm font-semibold text-violet-700">AI Answer</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{result.answer}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Source Events ({result.events.length})</span>
            </div>
            <div className="divide-y divide-gray-100">
              {result.events.map((e, i) => (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded font-medium shrink-0">{e.source}</span>
                  <span className="text-sm text-gray-600 flex-1">{e.content}</span>
                  <span className="text-xs text-gray-400 shrink-0">{e.ts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
