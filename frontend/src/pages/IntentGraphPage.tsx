import { useEffect, useState } from 'react';
import { Network, RefreshCw, ArrowDownRight, Sparkles } from 'lucide-react';
import { apiFetch } from '../api';

type Node = { id: string; kind: string; label: string; status?: string; actor?: string; type?: string; kpis?: string; amount?: number; kpi?: string };
type Edge = { from: string; to: string; kind: string };

const kindColor: Record<string, string> = {
  department: 'border-teal-500/50 bg-teal-500/10 text-teal-200',
  workflow: 'border-purple-500/50 bg-purple-500/10 text-purple-200',
  workflow_run: 'border-blue-500/50 bg-blue-500/10 text-blue-200',
  decision: 'border-amber-500/50 bg-amber-500/10 text-amber-200',
  ticket: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200',
};

export default function IntentGraphPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [counts, setCounts] = useState<any>({});
  const [departments, setDepartments] = useState<any[]>([]);
  const [selected, setSelected] = useState<Node | null>(null);
  const [trace, setTrace] = useState<any[]>([]);
  const [narration, setNarration] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      const [g, d] = await Promise.all([
        apiFetch('/cf-intent-graph/graph'),
        apiFetch('/cf-intent-graph/departments')
      ]);
      setNodes(g.nodes); setEdges(g.edges); setCounts(g.counts);
      setDepartments(d.departments);
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function openNode(n: Node) {
    setSelected(n); setTrace([]); setNarration('');
    const [kind, id] = n.id.split(':');
    const traceableKinds = ['ticket', 'decision', 'workflow_run'];
    const apiKind = kind === 'tic' ? 'ticket' : kind === 'dec' ? 'decision' : kind === 'run' ? 'agent_run' : null;
    if (!apiKind || !traceableKinds.includes(apiKind === 'agent_run' ? 'workflow_run' : apiKind)) return;
    try {
      const r = await apiFetch(`/cf-intent-graph/trace/${apiKind === 'agent_run' ? 'agent_run' : apiKind}/${id}`);
      setTrace(r.chain || []);
    } catch (e: any) { /* trace optional */ }
  }

  async function narrate(n: Node) {
    const [kind, id] = n.id.split(':');
    const k = kind === 'tic' ? 'ticket' : kind === 'dec' ? 'decision' : null;
    if (!k) return;
    setBusy(true);
    try {
      const r = await apiFetch('/cf-intent-graph/narrate', { method: 'POST', body: JSON.stringify({ kind: k, id: Number(id) }) });
      setNarration(r.narration);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  // Group nodes by kind for display
  const byKind: Record<string, Node[]> = {};
  nodes.forEach(n => { (byKind[n.kind] = byKind[n.kind] || []).push(n); });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Network className="w-6 h-6 text-teal-400" />Intent Graph</h1>
          <p className="text-gray-400 text-sm mt-1">Who said what, why, and what shipped. Department → workflow → run → decision → ticket. Click any node to trace the chain back to its origin intent.</p>
        </div>
        <button onClick={load} className="bg-teal-500 hover:bg-teal-400 text-gray-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><RefreshCw className="w-3 h-3" />Reload</button>
      </div>
      {error && <div className="bg-red-900/30 border border-red-700/50 text-red-300 p-3 rounded-lg text-sm mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        {Object.entries(counts).map(([k, v]) => (
          <div key={k} className="bg-gray-900 border border-gray-800 rounded-xl p-3"><div className="text-xs text-gray-400">{k}</div><div className="text-xl font-bold text-white">{String(v)}</div></div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h2 className="text-sm uppercase text-gray-400 mb-3">Department graph</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {departments.map(d => (
            <div key={d.id} className="bg-gray-950/50 border border-gray-800 rounded p-3 text-sm">
              <div className="text-white font-semibold">{d.name}</div>
              <div className="text-xs text-gray-400 mt-1">head {d.head_email || '?'} · {d.headcount} HC</div>
              <div className="text-xs text-teal-300 mt-1">{d.primary_kpis}</div>
              {d.downstream_deps && (
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1 flex-wrap"><ArrowDownRight className="w-3 h-3" />{d.downstream_deps}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {['workflow', 'workflow_run', 'decision', 'ticket'].map(kind => (
            <div key={kind} className="bg-gray-900 border border-gray-800 rounded-xl p-3">
              <h3 className="text-xs uppercase text-gray-400 mb-2">{kind} ({byKind[kind]?.length || 0})</h3>
              <div className="flex flex-wrap gap-1.5">
                {(byKind[kind] || []).map(n => (
                  <button key={n.id} onClick={() => openNode(n)} className={`text-xs px-2 py-1 rounded border ${kindColor[n.kind] || 'border-gray-800 bg-gray-800/40 text-gray-300'} ${selected?.id===n.id ? 'ring-1 ring-white/40' : ''}`}>
                    {n.label.slice(0, 40)}{n.label.length > 40 ? '…' : ''}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          {!selected && <div className="text-gray-500 text-sm">Click any node to inspect its chain.</div>}
          {selected && (
            <>
              <div className="text-xs text-teal-300">{selected.kind}</div>
              <h2 className="text-lg font-bold text-white mt-1">{selected.label}</h2>
              {selected.status && <div className="text-xs text-gray-400 mt-1">status {selected.status}</div>}
              {selected.actor && <div className="text-xs text-gray-400 mt-1">actor {selected.actor}</div>}
              {selected.kpi && <div className="text-xs text-teal-300 mt-1">kpi {selected.kpi}</div>}

              {trace.length > 0 && (
                <>
                  <div className="text-xs uppercase text-gray-400 mt-4 mb-2">Trace chain</div>
                  <ol className="space-y-2">
                    {trace.map((c, i) => (
                      <li key={i} className="bg-gray-950/50 border border-gray-800 rounded p-2 text-xs">
                        <div className="text-teal-300 font-semibold">{c.kind}</div>
                        <pre className="text-gray-300 mt-1 max-h-32 overflow-y-auto">{JSON.stringify(c.data, null, 2).slice(0, 600)}</pre>
                      </li>
                    ))}
                  </ol>
                </>
              )}

              {(selected.kind === 'ticket' || selected.kind === 'decision') && (
                <button onClick={()=>narrate(selected)} disabled={busy} className="mt-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-gray-950 text-sm font-bold px-3 py-1.5 rounded flex items-center gap-1"><Sparkles className="w-4 h-4" />Narrate chain</button>
              )}
              {narration && <div className="mt-3 text-sm text-gray-200 bg-gray-950/50 border border-gray-800 rounded p-3 whitespace-pre-wrap">{narration}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
