import { useEffect, useState } from 'react';
import { Activity, RefreshCw, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { apiFetch } from '../api';

type Kpi = {
  id: number; slug: string; name: string; department: string; unit: string;
  formula: string; target_value: number; good_direction: string;
  current_value: number | null; current_period: string | null; delta_pct: number | null;
  status: string;
};
type Snapshot = { period: string; value: number; prev_value: number | null; delta_pct: number | null; status: string; notes: string | null; recorded_at: string };

const statusColor: Record<string, string> = {
  green: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  yellow: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30',
  red: 'text-red-400 bg-red-500/10 border-red-500/30',
  unknown: 'text-gray-400 bg-gray-700/30 border-gray-700'
};

function fmt(val: number | null, unit: string) {
  if (val === null || val === undefined) return '—';
  if (unit === 'usd')   return `$${Number(val).toLocaleString()}`;
  if (unit === 'pct')   return `${Number(val).toFixed(1)}%`;
  if (unit === 'ratio') return `${Number(val).toFixed(2)}x`;
  if (unit === 'days' || unit === 'months' || unit === 'hours') return `${Number(val).toLocaleString()} ${unit}`;
  return String(val);
}

export default function KpiDashboard() {
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [selected, setSelected] = useState<Kpi | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [narration, setNarration] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState<any>(null);
  const [boardPack, setBoardPack] = useState<any>(null);

  async function load() {
    setError('');
    try {
      const [k, d, b] = await Promise.all([
        apiFetch('/kpis'),
        apiFetch('/kpis/dashboard'),
        apiFetch('/kpis/board/pack')
      ]);
      setKpis(k.kpis); setDashboard(d); setBoardPack(b);
      if (!selected && k.kpis.length) await openKpi(k.kpis[0]);
    } catch (e: any) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function openKpi(k: Kpi) {
    setSelected(k); setNarration(''); setSnapshots([]);
    try {
      const r = await apiFetch(`/kpis/${k.slug}`);
      setSnapshots(r.snapshots);
    } catch (e: any) { setError(e.message); }
  }
  async function narrate() {
    if (!selected) return;
    setBusy(true);
    try {
      const r = await apiFetch(`/kpis/${selected.slug}/narrate`, { method: 'POST' });
      setNarration(r.narration);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  const byDept: Record<string, Kpi[]> = {};
  kpis.forEach(k => { (byDept[k.department] = byDept[k.department] || []).push(k); });

  // mini sparkline coords
  const sparkPoints = (snaps: Snapshot[]) => {
    if (!snaps.length) return '';
    const vals = snaps.map(s => Number(s.value));
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    return vals.map((v, i) => `${(i / (vals.length - 1 || 1)) * 100},${100 - ((v - min) / range) * 90 - 5}`).join(' ');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Activity className="w-6 h-6 text-teal-400" />KPI Registry</h1>
          <p className="text-gray-400 text-sm mt-1">Real SaaS KPIs (ARR, CAC, LTV, NRR, gross retention, burn multiple, runway, gross margin, pipeline coverage, MTTR, CSAT). Targets, status banding, automated red-breach ticket creation.</p>
        </div>
        <button onClick={load} className="bg-teal-500 hover:bg-teal-400 text-gray-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"><RefreshCw className="w-3 h-3" />Reload</button>
      </div>
      {error && <div className="bg-red-900/30 border border-red-700/50 text-red-300 p-3 rounded-lg text-sm mb-4">{error}</div>}

      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Tracked KPIs</div><div className="text-2xl font-bold text-white">{dashboard.total}</div></div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Reds</div><div className="text-2xl font-bold text-red-400">{dashboard.red_count}</div></div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Yellows</div><div className="text-2xl font-bold text-yellow-300">{dashboard.yellow_count}</div></div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Greens</div><div className="text-2xl font-bold text-emerald-300">{dashboard.total - dashboard.red_count - dashboard.yellow_count}</div></div>
        </div>
      )}

      {boardPack && boardPack.top_concerns?.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <h2 className="text-sm uppercase text-gray-400 mb-2">Top concerns</h2>
          <div className="flex gap-2 flex-wrap">
            {boardPack.top_concerns.map((c: any) => (
              <div key={c.slug} className="bg-gray-950/50 border border-gray-800 rounded p-2 text-xs">
                <div className="text-white font-semibold">{c.name}</div>
                <div className="text-gray-400">{c.department} · {c.period}</div>
                <div className="text-red-400 mt-1">{fmt(Number(c.value), kpis.find(k=>k.slug===c.slug)?.unit || '')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {Object.entries(byDept).map(([dept, list]) => (
            <div key={dept} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm uppercase text-gray-400 mb-2">{dept}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {list.map(k => (
                  <button key={k.id} onClick={() => openKpi(k)} className={`text-left p-3 rounded border ${selected?.id===k.id ? 'border-teal-500/50 bg-teal-500/10' : 'border-gray-800 bg-gray-950/40 hover:bg-gray-900'}`}>
                    <div className="flex items-center justify-between">
                      <div className="text-white font-semibold text-sm">{k.name}</div>
                      <span className={`text-xs px-2 py-0.5 rounded border ${statusColor[k.status] || statusColor.unknown}`}>{k.status}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">target {fmt(Number(k.target_value), k.unit)}</div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xl text-white font-bold">{fmt(Number(k.current_value), k.unit)}</div>
                      {k.delta_pct != null && (
                        <div className={`text-xs flex items-center gap-1 ${Number(k.delta_pct) >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>
                          {Number(k.delta_pct) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Number(k.delta_pct).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          {!selected && <div className="text-gray-500 text-sm">Select a KPI to view history.</div>}
          {selected && (
            <>
              <h2 className="text-lg font-bold text-white">{selected.name}</h2>
              <div className="text-xs text-gray-400 mt-1">{selected.formula}</div>
              <div className="mt-3 flex items-center gap-3">
                <div className="text-3xl font-bold text-white">{fmt(Number(selected.current_value), selected.unit)}</div>
                <span className={`text-xs px-2 py-0.5 rounded border ${statusColor[selected.status] || statusColor.unknown}`}>{selected.status}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">target {fmt(Number(selected.target_value), selected.unit)} · good direction {selected.good_direction}</div>

              {snapshots.length > 1 && (
                <svg viewBox="0 0 100 100" className="w-full h-28 mt-4">
                  <polyline points={sparkPoints(snapshots)} fill="none" stroke="rgb(45,212,191)" strokeWidth="1.5" />
                </svg>
              )}

              <div className="mt-3 max-h-44 overflow-y-auto text-xs">
                <table className="w-full">
                  <thead><tr className="text-gray-400 text-left"><th>Period</th><th>Value</th><th>Δ</th><th>Status</th></tr></thead>
                  <tbody>
                    {snapshots.slice().reverse().map(s => (
                      <tr key={s.period} className="border-t border-gray-800/60">
                        <td className="py-1 text-gray-300">{s.period}</td>
                        <td className="py-1 text-white">{fmt(Number(s.value), selected.unit)}</td>
                        <td className={`py-1 ${Number(s.delta_pct||0) >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>{s.delta_pct != null ? `${Number(s.delta_pct).toFixed(1)}%` : '—'}</td>
                        <td><span className={`px-1.5 py-0.5 rounded text-[10px] border ${statusColor[s.status] || ''}`}>{s.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button onClick={narrate} disabled={busy} className="mt-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-gray-950 text-sm font-bold px-3 py-1.5 rounded flex items-center gap-1"><Sparkles className="w-4 h-4" />Narrate</button>
              {narration && <div className="mt-3 text-sm text-gray-200 bg-gray-950/50 border border-gray-800 rounded p-3 whitespace-pre-wrap">{narration}</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
