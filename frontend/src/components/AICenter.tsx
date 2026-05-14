import { useState, useEffect } from 'react';
import { Sparkles, Lightbulb, Search, AlertTriangle, Activity, Layers, Boxes, TrendingUp, FileText, BookOpen } from 'lucide-react';
import { api } from '../api';
import AIResponse from './AIResponse';
import type { DataSource } from '../types';

type TabId = 'insights'|'query'|'anomaly'|'health'|'cross'|'cluster'|'forecast'|'brief'|'narrate';

export default function AICenter() {
  const [activeTab, setActiveTab] = useState<TabId>('insights');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string|null>(null);
  const [focusArea, setFocusArea] = useState('');
  const [timeRange, setTimeRange] = useState('last 30 days');
  const [question, setQuestion] = useState('');
  const [anomalyDesc, setAnomalyDesc] = useState('');
  const [department, setDepartment] = useState('');
  const [sources, setSources] = useState<DataSource[]>([]);
  const [selectedSources, setSelectedSources] = useState<number[]>([]);
  const [clusterStatus, setClusterStatus] = useState('');
  const [forecastMetric, setForecastMetric] = useState('');
  const [forecastHorizon, setForecastHorizon] = useState('next 4 weeks');
  const [narrateQuestion, setNarrateQuestion] = useState('');
  const [narrateRowsText, setNarrateRowsText] = useState('');

  useEffect(() => {
    api.sources.list().then(setSources).catch(() => setSources([]));
  }, []);

  const call = async (fn: () => Promise<{result: string}>) => {
    setLoading(true); setResult(null);
    try { const d = await fn(); setResult(d.result); }
    catch (e) {
      const err = e as Error & { status?: number };
      if (err.status === 503) setResult('AI service unavailable: ' + err.message);
      else setResult('Error: ' + (err.message || 'Could not get AI response'));
    }
    finally { setLoading(false); }
  };

  const tabs: { id: TabId; label: string; icon: typeof Lightbulb }[] = [
    { id: 'insights', label: 'Generate Insights', icon: Lightbulb },
    { id: 'query', label: 'NL Query', icon: Search },
    { id: 'anomaly', label: 'Anomaly Explain', icon: AlertTriangle },
    { id: 'health', label: 'Health Analysis', icon: Activity },
    { id: 'cross', label: 'Cross-Source', icon: Layers },
    { id: 'cluster', label: 'Anomaly Clusters', icon: Boxes },
    { id: 'forecast', label: 'KPI Forecast', icon: TrendingUp },
    { id: 'brief', label: 'Weekly Brief', icon: FileText },
    { id: 'narrate', label: 'Result Narrator', icon: BookOpen },
  ];

  const submitNarrate = (e: React.FormEvent) => {
    e.preventDefault();
    let rows: object[] = [];
    try { rows = JSON.parse(narrateRowsText || '[]'); }
    catch { setResult('Error: rows must be valid JSON array'); return; }
    if (!Array.isArray(rows)) { setResult('Error: rows must be a JSON array'); return; }
    call(() => api.ai.queryNarrate(narrateQuestion, rows));
  };

  // Per-tab sample sets — realistic company-observability scenarios.
  const insightsSamples = [
    { label: 'Eng velocity', values: { focusArea: 'engineering velocity decline across GitHub PR throughput and Jira cycle time', timeRange: 'last 30 days' } },
    { label: 'Revenue health', values: { focusArea: 'MRR growth, churn risk, and Salesforce pipeline coverage vs target', timeRange: 'last 90 days' } },
    { label: 'Cust concentration', values: { focusArea: 'top-3 customer revenue concentration risk and Slack escalation patterns', timeRange: 'last 6 months' } },
  ];
  const querySamples = [
    { label: 'Burn & runway', values: { question: 'What is our current monthly burn from Stripe and AWS spend, and how many months of runway remain at current MRR?' } },
    { label: 'Deploys vs incidents', values: { question: 'How does GitHub deploy frequency last month correlate with AWS CloudWatch alarms and customer-reported incidents in Zendesk?' } },
    { label: 'Deal-won lag', values: { question: 'Which Salesforce deal-won events from last quarter took longest from first Slack mention to close, and what stages dragged?' } },
  ];
  const anomalySamples = [
    { label: 'Latency spike', values: { anomalyDesc: 'AWS CloudWatch p95 API latency spiked 350% (180ms -> 810ms) for 18 minutes during peak US-East traffic, coinciding with a GitHub deploy of payments-service v4.12.0; Stripe charge.failed rate climbed from 0.4% to 6.1% in the same window.' } },
    { label: 'Charge fail burst', values: { anomalyDesc: 'Stripe charge_failed events burst from ~12/hr baseline to 287 in a 30-minute window; 78% mapped to one card network (Visa), Slack #payments channel saw 14 customer escalations, no recent deploy.' } },
    { label: 'Churn cluster', values: { anomalyDesc: 'Five enterprise accounts (combined $1.4M ARR) all opened Zendesk tickets tagged "performance" within 72 hours, two downgraded plans in Stripe, and Salesforce CSM activity dropped 60% on those accounts last week.' } },
  ];
  const healthSamples = [
    { label: 'Engineering', values: { department: 'Engineering' } },
    { label: 'Sales', values: { department: 'Sales' } },
    { label: 'Customer Success', values: { department: 'Customer Success' } },
  ];
  const clusterSamples = [
    { label: 'Open only', values: { clusterStatus: 'open' } },
    { label: 'Investigating', values: { clusterStatus: 'investigating' } },
    { label: 'All', values: { clusterStatus: '' } },
  ];
  const forecastSamples = [
    { label: 'MRR Q+1', values: { forecastMetric: 'MRR (Stripe net of churn, expansion, new logos)', forecastHorizon: 'next quarter' } },
    { label: 'Eng velocity', values: { forecastMetric: 'engineering velocity (GitHub PRs merged + Jira story points completed per sprint)', forecastHorizon: 'next 4 weeks' } },
    { label: 'AWS spend', values: { forecastMetric: 'monthly AWS infrastructure spend', forecastHorizon: 'next 6 months' } },
  ];
  const narrateSamples = [
    { label: 'Dept health', values: { narrateQuestion: 'How did each department score this quarter and where are the largest movements?', narrateRowsText: JSON.stringify([
      { department: 'Engineering', score: 72, prev_score: 81, top_issue: 'cycle time +34%' },
      { department: 'Sales', score: 88, prev_score: 79, top_issue: 'pipeline coverage 3.2x' },
      { department: 'Customer Success', score: 64, prev_score: 71, top_issue: 'NPS -9, top-3 accounts at risk' },
      { department: 'DevOps', score: 69, prev_score: 76, top_issue: 'CloudWatch alarm volume +52%' }
    ], null, 2) } },
    { label: 'Top deals lost', values: { narrateQuestion: 'What were the top deals lost last quarter and the dominant loss reasons?', narrateRowsText: JSON.stringify([
      { deal: 'Acme Corp', amount: 240000, stage_lost: 'Procurement', reason: 'security review timeline', source: 'Salesforce' },
      { deal: 'Globex', amount: 185000, stage_lost: 'Negotiation', reason: 'price vs Competitor X', source: 'Salesforce' },
      { deal: 'Initech', amount: 96000, stage_lost: 'Demo', reason: 'missing SSO/SAML', source: 'Salesforce' }
    ], null, 2) } },
    { label: 'Anomaly burst', values: { narrateQuestion: 'Summarize the anomaly burst from last week for the exec brief.', narrateRowsText: JSON.stringify([
      { source: 'AWS', type: 'latency', metric: 'p95_ms', baseline: 180, peak: 810, duration_min: 18 },
      { source: 'Stripe', type: 'charge_failed', baseline_rate: 0.004, peak_rate: 0.061, duration_min: 30 },
      { source: 'GitHub', type: 'deploy', service: 'payments', version: 'v4.12.0', rollback: true }
    ], null, 2) } },
  ];

  type Sample<T> = { label: string; values: T };
  const SampleBar = <T extends object>({ samples, onPick }: { samples: Sample<T>[]; onPick: (v: T) => void }) => (
    <div className="flex flex-wrap gap-2 -mt-2">
      <span className="text-xs text-gray-500 self-center mr-1">Samples:</span>
      {samples.map(s => (
        <button key={s.label} type="button" onClick={() => onPick(s.values)} className="text-xs px-2.5 py-1 rounded-md bg-gray-800 border border-gray-700 text-teal-300 hover:bg-gray-700 hover:text-teal-200 transition-colors">
          {s.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center"><Sparkles className="w-5 h-5 text-white" /></div>
        <div><h1 className="text-2xl font-bold text-white">AI Center</h1><p className="text-gray-400 text-sm">AI-powered company intelligence and analysis</p></div>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setActiveTab(id); setResult(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === id ? 'bg-teal-500 text-gray-950' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 max-w-2xl">
        {activeTab === 'insights' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.generateInsights(focusArea, timeRange)); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Generate Insights</h2><p className="text-gray-400 text-sm mb-4">AI analyzes your operational data to surface patterns, risks, and opportunities.</p></div>
            <SampleBar samples={insightsSamples} onPick={v => { setFocusArea(v.focusArea); setTimeRange(v.timeRange); }} />
            <div><label className="block text-sm text-gray-300 mb-1">Focus Area</label><input value={focusArea} onChange={e=>setFocusArea(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g., revenue growth, engineering productivity, customer health" /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Time Range</label><select value={timeRange} onChange={e=>setTimeRange(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">{['last 7 days','last 30 days','last 90 days','last 6 months','last year'].map(t=><option key={t}>{t}</option>)}</select></div>
            <button type="submit" disabled={loading} className="w-full bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Generating...' : 'Generate Insights'}</button>
          </form>
        )}
        {activeTab === 'query' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.query(question)); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Natural Language Query</h2><p className="text-gray-400 text-sm mb-4">Ask any question about your company data in plain English.</p></div>
            <SampleBar samples={querySamples} onPick={v => { setQuestion(v.question); }} />
            <div><label className="block text-sm text-gray-300 mb-1">Your Question</label><textarea value={question} onChange={e=>setQuestion(e.target.value)} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" placeholder="e.g., What is our current burn rate and how many months of runway do we have?" required /></div>
            <button type="submit" disabled={loading} className="w-full bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Querying...' : 'Ask AI'}</button>
          </form>
        )}
        {activeTab === 'anomaly' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.anomalyExplanation(0, anomalyDesc)); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Anomaly Explanation</h2><p className="text-gray-400 text-sm mb-4">Get AI-powered root cause analysis and remediation steps for detected anomalies.</p></div>
            <SampleBar samples={anomalySamples} onPick={v => { setAnomalyDesc(v.anomalyDesc); }} />
            <div><label className="block text-sm text-gray-300 mb-1">Anomaly Description</label><textarea value={anomalyDesc} onChange={e=>setAnomalyDesc(e.target.value)} rows={4} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" placeholder="Describe the anomaly, e.g., API response times spiked 350% for 15 minutes during peak hours, affecting payment processing" required /></div>
            <button type="submit" disabled={loading} className="w-full bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Analyzing...' : 'Explain Anomaly'}</button>
          </form>
        )}
        {activeTab === 'health' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.healthAnalysis(department)); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Health Analysis</h2><p className="text-gray-400 text-sm mb-4">AI analyzes department health scores, identifies weaknesses, and recommends improvements.</p></div>
            <SampleBar samples={healthSamples} onPick={v => { setDepartment(v.department); }} />
            <div><label className="block text-sm text-gray-300 mb-1">Department (optional)</label><select value={department} onChange={e=>setDepartment(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"><option value="">All Departments</option>{['Engineering','Sales','Marketing','Customer Success','Product','DevOps','HR','Finance'].map(d=><option key={d}>{d}</option>)}</select></div>
            <button type="submit" disabled={loading} className="w-full bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Analyzing...' : 'Analyze Health'}</button>
          </form>
        )}
        {activeTab === 'cross' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.crossSourceInsight(selectedSources)); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Cross-Source Insight Generator</h2><p className="text-gray-400 text-sm mb-4">Surface patterns that only become visible by correlating multiple data sources.</p></div>
            <div className="flex flex-wrap gap-2 -mt-2">
              <span className="text-xs text-gray-500 self-center mr-1">Samples:</span>
              <button type="button" onClick={() => setSelectedSources(sources.filter(s => /github|aws|cloudwatch/i.test(`${s.name} ${s.type}`)).map(s => s.id))} className="text-xs px-2.5 py-1 rounded-md bg-gray-800 border border-gray-700 text-teal-300 hover:bg-gray-700 hover:text-teal-200 transition-colors">Deploy x Alarm</button>
              <button type="button" onClick={() => setSelectedSources(sources.filter(s => /salesforce|stripe|slack/i.test(`${s.name} ${s.type}`)).map(s => s.id))} className="text-xs px-2.5 py-1 rounded-md bg-gray-800 border border-gray-700 text-teal-300 hover:bg-gray-700 hover:text-teal-200 transition-colors">Revenue x Comms</button>
              <button type="button" onClick={() => setSelectedSources([])} className="text-xs px-2.5 py-1 rounded-md bg-gray-800 border border-gray-700 text-teal-300 hover:bg-gray-700 hover:text-teal-200 transition-colors">All sources</button>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Sources (leave empty for all)</label>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 max-h-44 overflow-y-auto space-y-1">
                {sources.map(s => (
                  <label key={s.id} className="flex items-center gap-2 text-sm text-gray-200">
                    <input type="checkbox" checked={selectedSources.includes(s.id)} onChange={e => setSelectedSources(prev => e.target.checked ? [...prev, s.id] : prev.filter(x => x !== s.id))} />
                    <span>{s.name} <span className="text-gray-500 text-xs">({s.type})</span></span>
                  </label>
                ))}
                {sources.length === 0 && <p className="text-gray-500 text-xs">No sources loaded.</p>}
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Analyzing...' : 'Generate Cross-Source Insights'}</button>
          </form>
        )}
        {activeTab === 'cluster' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.anomalyCluster(clusterStatus)); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Anomaly Clustering</h2><p className="text-gray-400 text-sm mb-4">Group anomalies by likely shared cause and recommend cluster-level fixes.</p></div>
            <SampleBar samples={clusterSamples} onPick={v => { setClusterStatus(v.clusterStatus); }} />
            <div><label className="block text-sm text-gray-300 mb-1">Status filter (optional)</label><select value={clusterStatus} onChange={e=>setClusterStatus(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"><option value="">All</option>{['open','investigating','monitoring','resolved'].map(s=><option key={s}>{s}</option>)}</select></div>
            <button type="submit" disabled={loading} className="w-full bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Clustering...' : 'Cluster Anomalies'}</button>
          </form>
        )}
        {activeTab === 'forecast' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.kpiForecast(forecastMetric, forecastHorizon)); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">KPI Forecaster</h2><p className="text-gray-400 text-sm mb-4">Forecast a key metric using recent operational data.</p></div>
            <SampleBar samples={forecastSamples} onPick={v => { setForecastMetric(v.forecastMetric); setForecastHorizon(v.forecastHorizon); }} />
            <div><label className="block text-sm text-gray-300 mb-1">Metric</label><input value={forecastMetric} onChange={e=>setForecastMetric(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g., MRR, engineering velocity, CSAT, monthly burn" required /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Horizon</label><select value={forecastHorizon} onChange={e=>setForecastHorizon(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">{['next 2 weeks','next 4 weeks','next quarter','next 6 months','next year'].map(t=><option key={t}>{t}</option>)}</select></div>
            <button type="submit" disabled={loading} className="w-full bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Forecasting...' : 'Forecast KPI'}</button>
          </form>
        )}
        {activeTab === 'brief' && (
          <form onSubmit={e => { e.preventDefault(); call(() => api.ai.weeklyBrief()); }} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Weekly Executive Brief</h2><p className="text-gray-400 text-sm mb-4">Generate a one-page CEO brief from the last two weeks of company data.</p></div>
            <button type="submit" disabled={loading} className="w-full bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Drafting...' : 'Generate Weekly Brief'}</button>
          </form>
        )}
        {activeTab === 'narrate' && (
          <form onSubmit={submitNarrate} className="space-y-4">
            <div><h2 className="text-lg font-semibold text-white mb-1">Query Result Narrator</h2><p className="text-gray-400 text-sm mb-4">Paste a JSON array of result rows; the AI converts it into an executive narrative.</p></div>
            <SampleBar samples={narrateSamples} onPick={v => { setNarrateQuestion(v.narrateQuestion); setNarrateRowsText(v.narrateRowsText); }} />
            <div><label className="block text-sm text-gray-300 mb-1">Question (context, optional)</label><input value={narrateQuestion} onChange={e=>setNarrateQuestion(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g., How did each department score this quarter?" /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Rows (JSON array)</label><textarea value={narrateRowsText} onChange={e=>setNarrateRowsText(e.target.value)} rows={8} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" placeholder='[{"department":"Engineering","score":72}, ...]' required /></div>
            <button type="submit" disabled={loading} className="w-full bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50">{loading ? 'Narrating...' : 'Narrate Result'}</button>
          </form>
        )}
        <AIResponse result={result} loading={loading} />
      </div>
    </div>
  );
}
