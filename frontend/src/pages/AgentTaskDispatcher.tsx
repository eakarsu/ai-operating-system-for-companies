import { useEffect, useState } from 'react';
import { Bot, Play, Sparkles, ListChecks, RefreshCw } from 'lucide-react';
import { apiFetch } from '../api';

type Agent = { slug: string; name: string; role: string; department: string; tool_slugs: string };
type Tool  = { slug: string; name: string; connector_vendor: string; side_effect: string; approval_required: boolean };
type Run   = { id: number; goal: string; status: string; steps_planned: number; steps_completed: number; agent_slug: string; agent_name: string; started_at: string; finished_at: string | null; cost_cents: number; outcome: string | null };
type PlanStep = { step: number; agent: string; tool: string; args: any; why: string; approval?: boolean };
type Plan = { plan: PlanStep[]; rationale: string; risk: string };

const sideEffectColor: Record<string, string> = {
  read: 'text-emerald-300', write: 'text-yellow-300', irreversible: 'text-red-400'
};
const statusColor: Record<string, string> = {
  succeeded: 'text-emerald-400', running: 'text-yellow-300', failed: 'text-red-400', blocked: 'text-orange-300'
};

export default function AgentTaskDispatcher() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tools,  setTools]  = useState<Tool[]>([]);
  const [runs,   setRuns]   = useState<Run[]>([]);
  const [goal,   setGoal]   = useState('Progress Globex new-logo opportunity to demo-scheduled');
  const [plan,   setPlan]   = useState<Plan | null>(null);
  const [llmUsed,setLlmUsed] = useState(false);
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState('');
  const [dispatched, setDispatched] = useState<{ agent_run_id: number; steps_executed: number } | null>(null);

  async function load() {
    setError('');
    try {
      const [c, r] = await Promise.all([
        apiFetch('/gap-ai-agent-task-dispatcher/catalog'),
        apiFetch('/gap-ai-agent-task-dispatcher/runs')
      ]);
      setAgents(c.agents); setTools(c.tools); setRuns(r.runs);
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function planOnly() {
    setBusy(true); setError(''); setDispatched(null); setPlan(null);
    try {
      const res = await apiFetch('/gap-ai-agent-task-dispatcher/dispatch', { method: 'POST', body: JSON.stringify({ goal, dry_run: true }) });
      setPlan(res.plan); setLlmUsed(res.llm_used);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  async function dispatch() {
    setBusy(true); setError('');
    try {
      const res = await apiFetch('/gap-ai-agent-task-dispatcher/dispatch', { method: 'POST', body: JSON.stringify({ goal }) });
      setPlan(res.plan); setLlmUsed(res.llm_used);
      setDispatched({ agent_run_id: res.agent_run_id, steps_executed: res.steps_executed });
      await load();
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Bot className="w-6 h-6 text-teal-400" />Agent Task Dispatcher</h1>
          <p className="text-gray-400 text-sm mt-1">Planner agent decomposes a goal into MCP-style tool calls across Salesforce, HubSpot, QuickBooks, Slack, Gmail, Linear, GitHub, Stripe. Decisions are logged and write actions queued for approval.</p>
        </div>
        <button onClick={load} className="bg-teal-500 hover:bg-teal-400 text-gray-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><RefreshCw className="w-3 h-3" />Reload</button>
      </div>
      {error && <div className="bg-red-900/30 border border-red-700/50 text-red-300 p-3 rounded-lg text-sm mb-4">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Agents</div><div className="text-2xl font-bold text-white">{agents.length}</div></div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">MCP tools</div><div className="text-2xl font-bold text-white">{tools.length}</div></div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Total runs</div><div className="text-2xl font-bold text-white">{runs.length}</div></div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-teal-400" />Dispatch goal</h2>
        <textarea value={goal} onChange={e=>setGoal(e.target.value)} rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="e.g. Recover us-east-1 payment outage" />
        <div className="flex gap-2 mt-3">
          <button onClick={planOnly} disabled={busy || !goal.trim()} className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-semibold px-3 py-1.5 rounded flex items-center gap-1"><ListChecks className="w-4 h-4" />Plan only</button>
          <button onClick={dispatch} disabled={busy || !goal.trim()} className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-gray-950 text-sm font-bold px-4 py-1.5 rounded flex items-center gap-1"><Play className="w-4 h-4" />Plan + dispatch</button>
          {busy && <span className="text-xs text-gray-400 self-center">working…</span>}
        </div>
      </div>

      {plan && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Plan ({plan.plan.length} steps)</h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-gray-400">risk:</span><span className={plan.risk === 'high' ? 'text-red-400' : plan.risk === 'medium' ? 'text-yellow-300' : 'text-emerald-300'}>{plan.risk}</span>
              <span className="text-gray-400">| llm:</span><span className={llmUsed ? 'text-teal-300' : 'text-gray-500'}>{llmUsed ? 'used' : 'fallback'}</span>
              {dispatched && <span className="text-emerald-300">| dispatched run #{dispatched.agent_run_id}</span>}
            </div>
          </div>
          <p className="text-xs text-gray-400 italic mb-3">{plan.rationale}</p>
          <ol className="space-y-2">
            {plan.plan.map((s, i) => {
              const tool = tools.find(t => t.slug === s.tool);
              return (
                <li key={i} className="bg-gray-950/50 border border-gray-800 rounded p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-white"><span className="text-teal-300 font-mono">{s.step}.</span> <span className="font-semibold">{s.tool}</span> via <span className="text-gray-400">{s.agent}</span></div>
                    <div className="flex gap-2 text-xs">
                      {tool && <span className={sideEffectColor[tool.side_effect]}>{tool.side_effect}</span>}
                      {s.approval && <span className="text-yellow-300">requires approval</span>}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 italic mb-1">{s.why}</div>
                  <pre className="text-xs text-gray-300 bg-gray-900 rounded p-2 overflow-x-auto">{JSON.stringify(s.args, null, 2)}</pre>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-3">Recent runs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-4">Goal</th><th className="py-2 pr-4">Agent</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4 text-right">Steps</th><th className="py-2 pr-4 text-right">Cost</th><th className="py-2 pr-4">Started</th>
            </tr></thead>
            <tbody>
              {runs.slice(0,20).map(r => (
                <tr key={r.id} className="border-b border-gray-800/60">
                  <td className="py-2 pr-4 text-white max-w-md truncate">{r.goal}</td>
                  <td className="py-2 pr-4 text-gray-300">{r.agent_name || r.agent_slug || '—'}</td>
                  <td className={`py-2 pr-4 ${statusColor[r.status] || 'text-gray-300'}`}>{r.status}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">{r.steps_completed}/{r.steps_planned}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">${((r.cost_cents||0)/100).toFixed(2)}</td>
                  <td className="py-2 pr-4 text-xs text-gray-400">{new Date(r.started_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
