import { useEffect, useState } from 'react';
import { Ticket, RefreshCw, CheckCircle2, Sparkles, ExternalLink } from 'lucide-react';
import { apiFetch } from '../api';

type T = {
  id: number; source_type: string; source_id: number | null; title: string; spec: string;
  assignee: string | null; external_url: string | null; status: string; priority: string;
  loop_closed_kpi: string | null; baseline_value: number | null; outcome_value: number | null;
  resolved_at: string | null; resolution_notes: string | null; created_at: string;
};
type Stats = {
  by_status: { status: string; n: number }[];
  by_source: { source_type: string; n: number }[];
  by_priority: { priority: string; n: number }[];
  loop_closure: { loop_closed_kpi: string; resolved: number; total: number; avg_delta: number }[];
  avg_cycle_days: number | null;
};

const priorityColor: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-300 border-red-500/40',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  low: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
};
const statusColor: Record<string, string> = {
  open: 'text-orange-300', in_progress: 'text-yellow-300', resolved: 'text-emerald-300', wont_fix: 'text-gray-400'
};

export default function ClosedLoopTicketsPage() {
  const [tickets, setTickets] = useState<T[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<T | null>(null);
  const [kpiHistory, setKpiHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState<{ status: string; priority: string }>({ status: '', priority: '' });
  const [specInput, setSpecInput] = useState({ source_type: 'anomaly', source_id: '', freeform: '' });
  const [generated, setGenerated] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try {
      const q = Object.entries(filter).filter(([_, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
      const [t, s] = await Promise.all([
        apiFetch(`/cf-closed-loop-tickets${q ? '?' + q : ''}`),
        apiFetch('/cf-closed-loop-tickets/stats')
      ]);
      setTickets(t.tickets); setStats(s);
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); }, [filter]);

  async function openTicket(t: T) {
    setSelected(t); setKpiHistory([]);
    try {
      const r = await apiFetch(`/cf-closed-loop-tickets/${t.id}`);
      setKpiHistory(r.kpi_history || []);
    } catch (e: any) { setError(e.message); }
  }
  async function resolve(t: T) {
    const notes = prompt('Resolution notes?'); if (notes === null) return;
    const outcome = prompt('Outcome value (number or blank)?');
    try {
      await apiFetch(`/cf-closed-loop-tickets/${t.id}/resolve`, { method: 'POST',
        body: JSON.stringify({ resolution_notes: notes, outcome_value: outcome ? Number(outcome) : null }) });
      await load();
      if (selected?.id === t.id) await openTicket({ ...t, status: 'resolved' });
    } catch (e: any) { setError(e.message); }
  }
  async function genSpec() {
    setBusy(true); setError(''); setGenerated(null);
    try {
      const body: any = {};
      if (specInput.freeform) body.freeform = specInput.freeform;
      else if (specInput.source_id) { body.source_type = specInput.source_type; body.source_id = Number(specInput.source_id); }
      else { setError('Provide source+id or freeform text'); setBusy(false); return; }
      const r = await apiFetch('/gap-ai-spec-generator/generate', { method: 'POST', body: JSON.stringify(body) });
      setGenerated(r);
      await load();
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Ticket className="w-6 h-6 text-teal-400" />Closed-Loop Tickets</h1>
          <p className="text-gray-400 text-sm mt-1">Anomaly/insight/KPI-breach → agent-executable spec → Linear-style ticket → resolution with measured outcome. Closes the open-loop → closed-loop transition.</p>
        </div>
        <button onClick={load} className="bg-teal-500 hover:bg-teal-400 text-gray-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><RefreshCw className="w-3 h-3" />Reload</button>
      </div>
      {error && <div className="bg-red-900/30 border border-red-700/50 text-red-300 p-3 rounded-lg text-sm mb-4">{error}</div>}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Total tickets</div><div className="text-2xl font-bold text-white">{tickets.length}</div></div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Open</div><div className="text-2xl font-bold text-orange-300">{stats.by_status.find(s=>s.status==='open')?.n || 0}</div></div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Resolved</div><div className="text-2xl font-bold text-emerald-300">{stats.by_status.find(s=>s.status==='resolved')?.n || 0}</div></div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Avg cycle days</div><div className="text-2xl font-bold text-white">{stats.avg_cycle_days ?? '—'}</div></div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <h2 className="text-sm uppercase text-gray-400 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-teal-400" />Generate spec → ticket</h2>
        <div className="flex flex-wrap gap-2">
          <select value={specInput.source_type} onChange={e=>setSpecInput({...specInput, source_type: e.target.value})} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm">
            <option value="anomaly">anomaly</option>
            <option value="insight">insight</option>
          </select>
          <input value={specInput.source_id} onChange={e=>setSpecInput({...specInput, source_id: e.target.value, freeform: ''})} placeholder="source id" className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm w-24" />
          <span className="text-gray-500 text-xs self-center">or</span>
          <input value={specInput.freeform} onChange={e=>setSpecInput({...specInput, freeform: e.target.value, source_id: ''})} placeholder="freeform signal text…" className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm flex-1 min-w-[200px]" />
          <button onClick={genSpec} disabled={busy} className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-gray-950 text-sm font-bold px-3 py-1.5 rounded">Generate</button>
        </div>
        {generated && (
          <div className="mt-3 bg-gray-950/50 border border-gray-800 rounded p-3 text-xs">
            <div className="text-emerald-300">Ticket #{generated.ticket_id} created · llm: {generated.llm_used ? 'used' : 'fallback'}</div>
            <div className="text-white font-semibold mt-1">{generated.spec.title}</div>
            <div className="text-gray-400 mt-1">target_kpi: {generated.spec.target_kpi || '—'} · priority: {generated.spec.priority} · assignee: {generated.spec.assignee_suggestion}</div>
            {generated.spec.spec_markdown && <pre className="mt-2 text-gray-300 whitespace-pre-wrap">{generated.spec.spec_markdown}</pre>}
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4 items-center">
        <select value={filter.status} onChange={e=>setFilter({...filter, status: e.target.value})} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm">
          <option value="">All statuses</option>
          <option value="open">open</option>
          <option value="in_progress">in_progress</option>
          <option value="resolved">resolved</option>
        </select>
        <select value={filter.priority} onChange={e=>setFilter({...filter, priority: e.target.value})} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm">
          <option value="">All priorities</option>
          <option value="critical">critical</option>
          <option value="high">high</option>
          <option value="medium">medium</option>
          <option value="low">low</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-3 max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-3">Title</th><th className="py-2 pr-3">Src</th><th className="py-2 pr-3">Priority</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">KPI</th><th className="py-2"></th>
            </tr></thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id} className={`border-b border-gray-800/60 ${selected?.id===t.id ? 'bg-gray-950/50' : ''}`}>
                  <td className="py-2 pr-3"><button onClick={()=>openTicket(t)} className="text-white text-left hover:text-teal-300">{t.title}</button></td>
                  <td className="py-2 pr-3 text-xs text-gray-400">{t.source_type}</td>
                  <td className="py-2 pr-3"><span className={`text-xs px-2 py-0.5 rounded border ${priorityColor[t.priority] || ''}`}>{t.priority}</span></td>
                  <td className={`py-2 pr-3 ${statusColor[t.status] || ''}`}>{t.status}</td>
                  <td className="py-2 pr-3 text-xs text-teal-300">{t.loop_closed_kpi || '—'}</td>
                  <td className="py-2 pr-2 flex gap-1">
                    {t.external_url && <a href={t.external_url} target="_blank" rel="noreferrer" className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-teal-300"><ExternalLink className="w-3.5 h-3.5" /></a>}
                    {t.status !== 'resolved' && <button onClick={()=>resolve(t)} title="Resolve" className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-emerald-300"><CheckCircle2 className="w-3.5 h-3.5" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          {!selected && <div className="text-gray-500 text-sm">Select a ticket.</div>}
          {selected && (
            <>
              <h2 className="text-lg font-bold text-white">{selected.title}</h2>
              <div className="text-xs text-gray-400 mt-1">{selected.source_type} #{selected.source_id || '?'} · priority {selected.priority}</div>
              <div className={`text-xs mt-1 ${statusColor[selected.status]}`}>{selected.status}{selected.resolved_at && ` · resolved ${new Date(selected.resolved_at).toLocaleDateString()}`}</div>
              {selected.loop_closed_kpi && (
                <div className="mt-3 bg-gray-950/50 border border-gray-800 rounded p-3 text-xs">
                  <div className="text-teal-300 font-semibold">KPI: {selected.loop_closed_kpi}</div>
                  <div className="text-gray-300">baseline {selected.baseline_value ?? '—'} → outcome {selected.outcome_value ?? '—'}</div>
                  {kpiHistory.length > 0 && (
                    <div className="mt-2 text-gray-400">history: {kpiHistory.slice(-4).map(h => `${h.period}=${h.value}`).join(' · ')}</div>
                  )}
                </div>
              )}
              {selected.spec && <pre className="mt-3 text-xs text-gray-200 bg-gray-950/50 border border-gray-800 rounded p-3 whitespace-pre-wrap max-h-80 overflow-y-auto">{selected.spec}</pre>}
              {selected.resolution_notes && <div className="mt-3 text-xs text-gray-400"><span className="text-gray-300 font-semibold">Resolution:</span> {selected.resolution_notes}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
