import { useEffect, useState } from 'react';
import { Bell, Plus, Trash2, Play } from 'lucide-react';
import { apiFetch } from '../api';

interface Rule { id: number; name: string; entity_type: string; match_field?: string; match_value?: string; operator: string; channel: string; destination?: string; enabled: boolean; }
interface Event { id: number; rule_id?: number; entity_type: string; entity_id: number; channel: string; destination?: string; status: string; fired_at: string; payload?: object; }

const BASE = '/gap-nonai-alerting';
const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

export default function GapAlerting() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', entity_type: 'anomaly', match_field: 'severity', match_value: 'critical', operator: '=', channel: 'in_app', destination: '' });

  const load = async () => {
    try {
      const r = await apiFetch(`${BASE}/rules`);
      const e = await apiFetch(`${BASE}/events?limit=50`);
      setRules(r.rules || []); setEvents(e.events || []);
    } catch (err) { setError((err as Error).message); }
  };
  useEffect(() => { load(); }, []);

  const createRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`${BASE}/rules`, { method: 'POST', body: JSON.stringify(form) });
      setForm({ name: '', entity_type: 'anomaly', match_field: 'severity', match_value: 'critical', operator: '=', channel: 'in_app', destination: '' });
      load();
    } catch (err) { setError((err as Error).message); }
  };
  const del = async (id: number) => {
    try { await apiFetch(`${BASE}/rules/${id}`, { method: 'DELETE' }); load(); }
    catch (err) { setError((err as Error).message); }
  };
  const evaluate = async () => {
    setBusy(true); setError(null);
    try { const r = await apiFetch(`${BASE}/evaluate`, { method: 'POST', body: '{}' }); alert(`Evaluated ${r.rules_evaluated} rules; fired ${r.alerts_fired} alerts`); load(); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  const ack = async (id: number) => {
    try { await apiFetch(`${BASE}/events/${id}/ack`, { method: 'POST', body: '{}' }); load(); }
    catch (err) { setError((err as Error).message); }
  };

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center"><Bell className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-white">Alerting / Notifications</h1><p className="text-gray-400 text-sm">{rules.length} rules | {events.length} recent fires</p></div>
        </div>
        <button onClick={evaluate} disabled={busy} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-gray-950 px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"><Play className="w-4 h-4" />{busy ? 'Evaluating...' : 'Evaluate Now'}</button>
      </div>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 max-w-5xl">
        <h2 className="text-white font-bold mb-3 flex items-center gap-2"><Plus className="w-4 h-4" />New Rule</h2>
        <form onSubmit={createRule} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className={inp} placeholder="rule name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
          <select className={inp} value={form.entity_type} onChange={e=>setForm({...form,entity_type:e.target.value})}>
            <option>anomaly</option><option>event</option><option>health</option><option>kpi</option>
          </select>
          <input className={inp} placeholder="match_field (severity)" value={form.match_field} onChange={e=>setForm({...form,match_field:e.target.value})} />
          <select className={inp} value={form.operator} onChange={e=>setForm({...form,operator:e.target.value})}>
            <option>=</option><option>!=</option><option>&gt;</option><option>&lt;</option><option>contains</option>
          </select>
          <input className={inp} placeholder="match_value" value={form.match_value} onChange={e=>setForm({...form,match_value:e.target.value})} />
          <select className={inp} value={form.channel} onChange={e=>setForm({...form,channel:e.target.value})}>
            <option>in_app</option><option>email</option><option>slack</option><option>webhook</option>
          </select>
          <input className={inp} placeholder="destination" value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})} />
          <button className="bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold rounded-lg text-sm">Create</button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-white font-bold mb-3">Rules</h2>
          {rules.length === 0 ? <p className="text-gray-500 text-sm">None.</p> :
            <ul className="divide-y divide-gray-800">
              {rules.map(r => (
                <li key={r.id} className="py-2 flex items-center justify-between">
                  <div><div className="text-sm text-white font-medium">{r.name}</div><div className="text-xs text-gray-400">{r.entity_type}.{r.match_field} {r.operator} {r.match_value} → {r.channel}{r.destination ? `:${r.destination}` : ''}</div></div>
                  <button onClick={()=>del(r.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                </li>
              ))}
            </ul>}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-white font-bold mb-3">Recent Alert Fires</h2>
          {events.length === 0 ? <p className="text-gray-500 text-sm">None.</p> :
            <ul className="divide-y divide-gray-800">
              {events.map(ev => (
                <li key={ev.id} className="py-2 flex items-center justify-between">
                  <div><div className="text-sm text-white">{ev.entity_type} #{ev.entity_id} → {ev.channel}</div><div className="text-xs text-gray-500">{new Date(ev.fired_at).toLocaleString()} | <span className="text-teal-400">{ev.status}</span></div></div>
                  {ev.status !== 'ack' && <button onClick={()=>ack(ev.id)} className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded">ack</button>}
                </li>
              ))}
            </ul>}
        </div>
      </div>
    </div>
  );
}
