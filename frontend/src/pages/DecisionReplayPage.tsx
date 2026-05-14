import { useEffect, useState } from 'react';
import { ScrollText, RefreshCw, Undo2, Search } from 'lucide-react';
import { apiFetch } from '../api';

// lucide-react doesn't have Replay; alias to History-style icon
const ReplayIcon = ScrollText;

type Decision = {
  id: number; agent_run_id: number | null; workflow_run_id: number | null;
  decision_type: string; actor: string; subject: string; rationale: string;
  evidence: any; alternatives_considered: any;
  confidence_pct: number | null; reversible: boolean; reverted_at: string | null;
  human_approved: boolean | null; created_at: string;
};
type Stats = {
  by_type: { decision_type: string; n: number; avg_confidence: number; approved: number; reverted: number }[];
  by_actor: { actor_kind: string; actor_name: string; n: number }[];
};

export default function DecisionReplayPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<Decision | null>(null);
  const [context, setContext] = useState<any>(null);
  const [retro, setRetro] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<{ actor: string; type: string }>({ actor: '', type: '' });
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      const q = Object.entries(filter).filter(([_, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
      const [d, s] = await Promise.all([
        apiFetch(`/gap-ai-decision-replay${q ? '?' + q : ''}`),
        apiFetch('/gap-ai-decision-replay/stats')
      ]);
      setDecisions(d.decisions); setStats(s);
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); }, [filter]);

  async function openDecision(d: Decision) {
    setSelected(d); setContext(null); setRetro('');
    try {
      const r = await apiFetch(`/gap-ai-decision-replay/${d.id}`);
      setContext(r.context);
    } catch (e: any) { setError(e.message); }
  }
  async function runReplay() {
    if (!selected) return;
    setBusy(true);
    try {
      const r = await apiFetch(`/gap-ai-decision-replay/${selected.id}/replay`, { method: 'POST' });
      setRetro(r.retro);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  async function revertDecision() {
    if (!selected) return;
    if (!confirm('Revert this decision? (cosmetic only — records reverted_at on the log row)')) return;
    try {
      await apiFetch(`/gap-ai-decision-replay/${selected.id}/revert`, { method: 'POST' });
      await load();
      await openDecision(selected);
    } catch (e: any) { setError(e.message); }
  }

  const types = Array.from(new Set(decisions.map(d => d.decision_type)));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ReplayIcon className="w-6 h-6 text-teal-400" />Decision Replay</h1>
          <p className="text-gray-400 text-sm mt-1">Every agent and human decision — actor, evidence, alternatives, confidence, reversibility. Scrub history, replay with hindsight, revert reversible decisions.</p>
        </div>
        <button onClick={load} className="bg-teal-500 hover:bg-teal-400 text-gray-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><RefreshCw className="w-3 h-3" />Reload</button>
      </div>
      {error && <div className="bg-red-900/30 border border-red-700/50 text-red-300 p-3 rounded-lg text-sm mb-4">{error}</div>}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Total decisions</div><div className="text-2xl font-bold text-white">{decisions.length}</div></div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Avg confidence</div><div className="text-2xl font-bold text-white">{stats.by_type.length ? (stats.by_type.reduce((s,t)=>s+Number(t.avg_confidence||0)*Number(t.n),0)/stats.by_type.reduce((s,t)=>s+Number(t.n),0)).toFixed(0) : '—'}%</div></div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Agent decisions</div><div className="text-2xl font-bold text-teal-300">{stats.by_actor.filter(a=>a.actor_kind==='agent').reduce((s,a)=>s+Number(a.n),0)}</div></div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Human decisions</div><div className="text-2xl font-bold text-amber-300">{stats.by_actor.filter(a=>a.actor_kind==='human').reduce((s,a)=>s+Number(a.n),0)}</div></div>
        </div>
      )}

      <div className="flex gap-2 mb-4 items-center flex-wrap">
        <Search className="w-4 h-4 text-gray-500" />
        <input value={filter.actor} onChange={e=>setFilter({...filter, actor: e.target.value})} placeholder="filter actor (e.g. agent:planner)" className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm flex-1 min-w-[200px]" />
        <select value={filter.type} onChange={e=>setFilter({...filter, type: e.target.value})} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm">
          <option value="">All types</option>
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-3 max-h-[70vh] overflow-y-auto">
          {decisions.map(d => (
            <button key={d.id} onClick={()=>openDecision(d)} className={`w-full text-left p-3 mb-1 rounded ${selected?.id===d.id ? 'bg-teal-500/20 border border-teal-500/40' : 'hover:bg-gray-800/60'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-teal-300 font-mono">{d.decision_type}</span>
                <span className="text-xs text-gray-500">{new Date(d.created_at).toLocaleString()}</span>
              </div>
              <div className="text-sm text-white mt-1 truncate">{d.subject}</div>
              <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                <span>{d.actor}</span>
                {d.confidence_pct && <span>conf {d.confidence_pct}%</span>}
                {!d.reversible && <span className="text-red-400">irreversible</span>}
                {d.reverted_at && <span className="text-orange-300">reverted</span>}
              </div>
            </button>
          ))}
        </div>
        <div className="lg:col-span-3 bg-gray-900 border border-gray-800 rounded-xl p-5">
          {!selected && <div className="text-gray-500 text-sm">Select a decision to inspect.</div>}
          {selected && (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-teal-300 font-mono">{selected.decision_type}</div>
                <h2 className="text-xl font-bold text-white mt-1">{selected.subject}</h2>
                <div className="text-xs text-gray-400 mt-1">by {selected.actor} · {new Date(selected.created_at).toLocaleString()}</div>
              </div>
              <div className="text-sm text-gray-300">{selected.rationale}</div>
              {selected.evidence && (
                <div><div className="text-xs uppercase text-gray-400 mb-1">Evidence</div><pre className="text-xs text-gray-300 bg-gray-950/50 p-3 rounded overflow-x-auto">{JSON.stringify(selected.evidence, null, 2)}</pre></div>
              )}
              {selected.alternatives_considered && (
                <div><div className="text-xs uppercase text-gray-400 mb-1">Alternatives considered</div><pre className="text-xs text-gray-300 bg-gray-950/50 p-3 rounded overflow-x-auto">{JSON.stringify(selected.alternatives_considered, null, 2)}</pre></div>
              )}
              {context && context.kpi_at_time && context.kpi_at_time.length > 0 && (
                <div>
                  <div className="text-xs uppercase text-gray-400 mb-1">KPIs visible at decision time</div>
                  <div className="flex flex-wrap gap-2">
                    {context.kpi_at_time.slice(0,6).map((k: any) => (
                      <span key={`${k.slug}-${k.period}`} className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1"><span className="text-gray-400">{k.slug}</span> <span className="text-white">{k.value}</span> <span className={k.status==='red'?'text-red-400':k.status==='yellow'?'text-yellow-300':'text-emerald-300'}>[{k.status}]</span></span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2 border-t border-gray-800">
                <button onClick={runReplay} disabled={busy} className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-gray-950 text-sm font-bold px-3 py-1.5 rounded flex items-center gap-1"><ReplayIcon className="w-4 h-4" />Replay with hindsight</button>
                {selected.reversible && !selected.reverted_at && (
                  <button onClick={revertDecision} className="bg-orange-500 hover:bg-orange-400 text-gray-950 text-sm font-bold px-3 py-1.5 rounded flex items-center gap-1"><Undo2 className="w-4 h-4" />Mark reverted</button>
                )}
              </div>
              {retro && (
                <div className="bg-gray-950/50 border border-gray-800 rounded p-3 text-sm text-gray-200 whitespace-pre-wrap">{retro}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
