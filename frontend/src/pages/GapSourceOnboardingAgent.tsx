import { useEffect, useState } from 'react';
import { Plug } from 'lucide-react';
import { apiFetch } from '../api';

interface Step { order: number; name: string; description: string; owner: string; }
interface Plan { vendor: string; goal?: string; hint: { dept: string; kpis: string[]; auth: string; scopes: string; cadence: string }; steps: Step[]; rationale: string; risks: string[]; estimated_days: number; }
interface PlanRow { id: number; vendor: string; goal?: string; status: string; created_at: string; }
interface PlanFull { id: number; vendor: string; goal?: string; status: string; plan: Plan; created_at: string; }

const BASE = '/gap-ai-source-onboarding-agent';
const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

export default function GapSourceOnboardingAgent() {
  const [vendor, setVendor] = useState('stripe');
  const [goal, setGoal] = useState('');
  const [active, setActive] = useState<PlanFull | null>(null);
  const [list, setList] = useState<PlanRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadList = async () => {
    try { const r = await apiFetch(`${BASE}/plans`); setList(r.plans || []); }
    catch (err) { setError((err as Error).message); }
  };
  useEffect(() => { loadList(); }, []);

  const generate = async () => {
    setBusy(true); setError(null);
    try {
      const r = await apiFetch(`${BASE}/plan`, { method: 'POST', body: JSON.stringify({ vendor, goal }) });
      const full = await apiFetch(`${BASE}/plans/${r.id}`);
      setActive(full.plan); loadList();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  const setStatus = async (id: number, status: string) => {
    try { const r = await apiFetch(`${BASE}/plans/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }); setActive(r.plan); loadList(); }
    catch (err) { setError((err as Error).message); }
  };
  const open = async (id: number) => {
    try { const r = await apiFetch(`${BASE}/plans/${id}`); setActive(r.plan); }
    catch (err) { setError((err as Error).message); }
  };

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center"><Plug className="w-5 h-5 text-white" /></div>
        <div><h1 className="text-2xl font-bold text-white">Source Onboarding Agent</h1><p className="text-gray-400 text-sm">Vendor-aware ordered onboarding plans</p></div>
      </div>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 max-w-4xl mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm text-gray-300 mb-1">Vendor</label><input className={inp} value={vendor} onChange={e=>setVendor(e.target.value)} placeholder="stripe, salesforce..." /></div>
          <div><label className="block text-sm text-gray-300 mb-1">Goal (optional)</label><input className={inp} value={goal} onChange={e=>setGoal(e.target.value)} placeholder="e.g. wire MRR + churn KPIs" /></div>
        </div>
        <button onClick={generate} disabled={busy} className="mt-3 bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50">{busy ? 'Planning...' : 'Generate Plan'}</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-6xl">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-white font-bold mb-3">Plans</h2>
          {list.length === 0 ? <p className="text-gray-500 text-sm">None.</p> :
            <ul className="divide-y divide-gray-800">
              {list.map(p => (
                <li key={p.id} className="py-2">
                  <button onClick={()=>open(p.id)} className="text-left w-full">
                    <div className="text-sm text-white font-medium">{p.vendor}</div>
                    <div className="text-xs text-gray-500">{p.status} | {new Date(p.created_at).toLocaleString()}</div>
                  </button>
                </li>
              ))}
            </ul>}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 lg:col-span-2">
          {!active ? <p className="text-gray-500 text-sm">Pick or generate a plan.</p> :
            <>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-white font-bold">{active.vendor} ({active.status})</h2>
                <div className="flex gap-2 text-xs">
                  <button onClick={()=>setStatus(active.id,'approved')} className="bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded">approve</button>
                  <button onClick={()=>setStatus(active.id,'executing')} className="bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded">execute</button>
                  <button onClick={()=>setStatus(active.id,'done')} className="bg-teal-500 text-gray-950 px-2 py-1 rounded font-bold">done</button>
                </div>
              </div>
              <div className="text-xs text-gray-500 mb-3">Dept {active.plan.hint.dept} | auth {active.plan.hint.auth} | cadence {active.plan.hint.cadence} | ~{active.plan.estimated_days} days</div>
              <div className="text-xs text-gray-300 mb-2 italic">{active.plan.rationale}</div>
              <ol className="space-y-2 mb-3">
                {active.plan.steps.map(s => (
                  <li key={s.order} className="bg-gray-950 border border-gray-800 rounded p-2">
                    <div className="text-sm text-white font-medium">{s.order}. {s.name}</div>
                    <div className="text-xs text-gray-400">{s.description} | owner: <span className="text-teal-400">{s.owner}</span></div>
                  </li>
                ))}
              </ol>
              <div className="text-xs text-red-300">Risks: {active.plan.risks.join(' | ')}</div>
            </>}
        </div>
      </div>
    </div>
  );
}
