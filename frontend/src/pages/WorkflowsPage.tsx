import { useEffect, useState } from 'react';
import { Workflow, RefreshCw, PlayCircle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../api';

type WF = { id: number; slug: string; name: string; description: string; trigger_type: string; departments: string;
  sla_hours: number | null; active: boolean; total_runs: number; active_runs: number; blocked_runs: number; sla_breached: number };
type Run = { id: number; external_ref: string; subject: string; current_step: string; status: string; amount_usd: number | null; started_at: string; finished_at: string | null; sla_breached: boolean; context: any };
type Step = { step_name: string; step_order: number; status: string; agent: string | null; input: any; output: any; started_at: string | null; finished_at: string | null; duration_ms: number | null };
type Summary = { slug: string; name: string; running: number; blocked: number; succeeded: number; failed: number; sla_breached: number; cash_unlocked: string; at_risk: string };

const statusColor: Record<string, string> = {
  running: 'text-yellow-300', blocked: 'text-orange-300', succeeded: 'text-emerald-300', failed: 'text-red-400', cancelled: 'text-gray-400',
  ok: 'text-emerald-300', pending: 'text-gray-400', skipped: 'text-gray-500'
};

export default function WorkflowsPage() {
  const [wfs, setWfs] = useState<WF[]>([]);
  const [summary, setSummary] = useState<Summary[]>([]);
  const [selected, setSelected] = useState<WF | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [openRun, setOpenRun] = useState<Run | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      const [a, b] = await Promise.all([
        apiFetch('/workflows'),
        apiFetch('/workflows/_summary/by-status')
      ]);
      setWfs(a.workflows); setSummary(b.rows);
      if (!selected && a.workflows.length) await openWf(a.workflows[0]);
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function openWf(w: WF) {
    setSelected(w); setRuns([]); setOpenRun(null); setSteps([]);
    try {
      const r = await apiFetch(`/workflows/${w.slug}`);
      setRuns(r.runs);
    } catch (e: any) { setError(e.message); }
  }
  async function openRunDetails(r: Run) {
    setOpenRun(r);
    try {
      const d = await apiFetch(`/workflows/runs/${r.id}`);
      setSteps(d.steps);
    } catch (e: any) { setError(e.message); }
  }
  async function advance(r: Run) {
    try { await apiFetch(`/workflows/runs/${r.id}/advance`, { method: 'POST', body: JSON.stringify({}) }); await openWf(selected!); }
    catch (e: any) { setError(e.message); }
  }
  async function block(r: Run) {
    const reason = prompt('Block reason?'); if (!reason) return;
    try { await apiFetch(`/workflows/runs/${r.id}/block`, { method: 'POST', body: JSON.stringify({ reason }) }); await openWf(selected!); }
    catch (e: any) { setError(e.message); }
  }

  const cashUnlocked = summary.reduce((s, r) => s + Number(r.cash_unlocked || 0), 0);
  const atRisk      = summary.reduce((s, r) => s + Number(r.at_risk || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Workflow className="w-6 h-6 text-teal-400" />Cross-Functional Workflows</h1>
          <p className="text-gray-400 text-sm mt-1">Lead → Quote → Contract → Invoice → Cash plus incident, churn-save, hire-loop, monthly-close, and weekly-brief. Real run state, SLA tracking, decision-log linkage.</p>
        </div>
        <button onClick={load} className="bg-teal-500 hover:bg-teal-400 text-gray-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><RefreshCw className="w-3 h-3" />Reload</button>
      </div>
      {error && <div className="bg-red-900/30 border border-red-700/50 text-red-300 p-3 rounded-lg text-sm mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Workflows</div><div className="text-2xl font-bold text-white">{wfs.length}</div></div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">SLA breaches</div><div className="text-2xl font-bold text-red-400">{wfs.reduce((s,w)=>s+Number(w.sla_breached),0)}</div></div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Cash unlocked (90d)</div><div className="text-2xl font-bold text-emerald-300">${cashUnlocked.toLocaleString()}</div></div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">At-risk in pipeline</div><div className="text-2xl font-bold text-yellow-300">${atRisk.toLocaleString()}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 max-h-[70vh] overflow-y-auto">
          {wfs.map(w => (
            <button key={w.id} onClick={()=>openWf(w)} className={`w-full text-left p-3 mb-1 rounded ${selected?.id===w.id ? 'bg-teal-500/20 border border-teal-500/40' : 'hover:bg-gray-800/60'}`}>
              <div className="text-white font-semibold text-sm">{w.name}</div>
              <div className="text-xs text-gray-400 mt-1">{w.departments}</div>
              <div className="text-xs text-gray-500 mt-1">trigger {w.trigger_type} · SLA {w.sla_hours ? `${w.sla_hours}h` : '—'}</div>
              <div className="flex gap-3 text-xs mt-2">
                <span className="text-yellow-300">▶ {w.active_runs}</span>
                <span className="text-orange-300">⏸ {w.blocked_runs}</span>
                <span className="text-red-400">⚠ {w.sla_breached}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          {!selected && <div className="text-gray-500 text-sm">Select a workflow.</div>}
          {selected && (
            <>
              <h2 className="text-lg font-bold text-white">{selected.name}</h2>
              <p className="text-sm text-gray-400 mt-1">{selected.description}</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                    <th className="py-2 pr-4">External ref</th><th className="py-2 pr-4">Subject</th><th className="py-2 pr-4">Step</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4 text-right">Amount</th><th className="py-2"></th>
                  </tr></thead>
                  <tbody>
                    {runs.map(r => (
                      <tr key={r.id} className={`border-b border-gray-800/60 ${openRun?.id===r.id ? 'bg-gray-950/50' : ''}`}>
                        <td className="py-2 pr-4"><button onClick={()=>openRunDetails(r)} className="text-teal-300 hover:text-teal-200 font-mono text-xs">{r.external_ref}</button></td>
                        <td className="py-2 pr-4 text-white max-w-xs truncate">{r.subject}</td>
                        <td className="py-2 pr-4 text-gray-300">{r.current_step}</td>
                        <td className={`py-2 pr-4 ${statusColor[r.status] || ''}`}>{r.status}{r.sla_breached && <AlertOctagon className="inline w-3 h-3 ml-1 text-red-400" />}</td>
                        <td className="py-2 pr-4 text-right text-gray-300">{r.amount_usd ? `$${Number(r.amount_usd).toLocaleString()}` : '—'}</td>
                        <td className="py-2 pr-2 flex gap-1">
                          {r.status === 'running' && <button onClick={()=>advance(r)} title="Advance" className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" /></button>}
                          {r.status === 'running' && <button onClick={()=>block(r)} title="Block" className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-orange-300"><AlertOctagon className="w-3.5 h-3.5" /></button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {openRun && steps.length > 0 && (
                <div className="mt-5 pt-4 border-t border-gray-800">
                  <div className="text-xs uppercase text-gray-400 mb-2">Steps for {openRun.external_ref}</div>
                  <ol className="space-y-1">
                    {steps.map(s => (
                      <li key={s.step_order} className="bg-gray-950/50 border border-gray-800 rounded p-2 text-xs flex items-center gap-3">
                        <span className="text-teal-300 font-mono w-6">{s.step_order}.</span>
                        <span className="text-white flex-1">{s.step_name}</span>
                        <span className="text-gray-400">{s.agent || '—'}</span>
                        <span className={statusColor[s.status] || 'text-gray-300'}>{s.status}</span>
                        <span className="text-gray-500">{s.duration_ms ? `${Math.round(s.duration_ms/1000)}s` : ''}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
