import { useEffect, useState } from 'react';
import { Lock, Plus, Trash2, Eraser } from 'lucide-react';
import { apiFetch } from '../api';

interface Policy { id: number; name: string; pattern_type: string; custom_regex?: string; replacement: string; retention_days: number; enabled: boolean; }
interface Redaction { id: number; policy_id?: number; policy_name?: string; pattern_type?: string; source_text_hash?: string; matches_count: number; redacted_preview?: string; created_at: string; }

const BASE = '/gap-nonai-pii-redaction';
const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

export default function GapPiiRedaction() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [recent, setRecent] = useState<Redaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', pattern_type: 'email', custom_regex: '', replacement: '[REDACTED]', retention_days: 90 });
  const [text, setText] = useState('Contact me at jane@example.com or 415-555-1212. SSN 123-45-6789.');
  const [result, setResult] = useState<{ redacted: string; breakdown: { policy_name: string; matches: number }[] } | null>(null);

  const load = async () => {
    try {
      const p = await apiFetch(`${BASE}/policies`);
      const r = await apiFetch(`${BASE}/redactions?limit=30`);
      setPolicies(p.policies || []); setRecent(r.redactions || []);
    } catch (err) { setError((err as Error).message); }
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`${BASE}/policies`, { method: 'POST', body: JSON.stringify(form) });
      setForm({ name: '', pattern_type: 'email', custom_regex: '', replacement: '[REDACTED]', retention_days: 90 });
      load();
    } catch (err) { setError((err as Error).message); }
  };
  const del = async (id: number) => {
    try { await apiFetch(`${BASE}/policies/${id}`, { method: 'DELETE' }); load(); }
    catch (err) { setError((err as Error).message); }
  };
  const redact = async () => {
    setError(null); setResult(null);
    try { setResult(await apiFetch(`${BASE}/redact`, { method: 'POST', body: JSON.stringify({ text }) })); load(); }
    catch (err) { setError((err as Error).message); }
  };
  const purge = async () => {
    try { const r = await apiFetch(`${BASE}/purge-expired`, { method: 'POST', body: '{}' }); alert(`Purged ${r.purged} expired rows`); load(); }
    catch (err) { setError((err as Error).message); }
  };

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center"><Lock className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-white">PII Redaction / Retention</h1><p className="text-gray-400 text-sm">{policies.length} policies</p></div>
        </div>
        <button onClick={purge} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm"><Eraser className="w-4 h-4" />Purge expired</button>
      </div>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-white font-bold mb-3 flex items-center gap-2"><Plus className="w-4 h-4" />New Policy</h2>
          <form onSubmit={create} className="space-y-2">
            <input className={inp} placeholder="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
            <select className={inp} value={form.pattern_type} onChange={e=>setForm({...form,pattern_type:e.target.value})}>
              <option>email</option><option>phone</option><option>ssn</option><option>credit_card</option><option>custom</option>
            </select>
            {form.pattern_type === 'custom' && (
              <input className={inp} placeholder="custom_regex (no anchors)" value={form.custom_regex} onChange={e=>setForm({...form,custom_regex:e.target.value})} />
            )}
            <input className={inp} placeholder="replacement" value={form.replacement} onChange={e=>setForm({...form,replacement:e.target.value})} />
            <input className={inp} type="number" placeholder="retention_days" value={form.retention_days} onChange={e=>setForm({...form,retention_days:parseInt(e.target.value)||90})} />
            <button className="bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm">Create</button>
          </form>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-white font-bold mb-3">Try Redaction</h2>
          <textarea className={inp+" h-32 resize-none font-mono"} value={text} onChange={e=>setText(e.target.value)} />
          <button onClick={redact} className="mt-2 bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm">Redact</button>
          {result && (
            <div className="mt-3 bg-gray-950 border border-gray-800 rounded p-3">
              <div className="text-xs text-gray-500 mb-1">Redacted:</div>
              <div className="text-sm text-teal-300 font-mono whitespace-pre-wrap">{result.redacted}</div>
              <div className="text-xs text-gray-500 mt-2">Matches: {result.breakdown.map(b => `${b.policy_name} (${b.matches})`).join(', ') || '(none)'}</div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-white font-bold mb-3">Policies</h2>
          {policies.length === 0 ? <p className="text-gray-500 text-sm">None.</p> :
            <ul className="divide-y divide-gray-800">
              {policies.map(p => (
                <li key={p.id} className="py-2 flex items-center justify-between">
                  <div><div className="text-sm text-white font-medium">{p.name} <span className="text-gray-500">({p.pattern_type})</span></div><div className="text-xs text-gray-400">replace → {p.replacement} | retain {p.retention_days}d | {p.enabled ? 'on' : 'off'}</div></div>
                  <button onClick={()=>del(p.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                </li>
              ))}
            </ul>}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-white font-bold mb-3">Recent Redactions</h2>
          {recent.length === 0 ? <p className="text-gray-500 text-sm">None.</p> :
            <ul className="divide-y divide-gray-800">
              {recent.map(r => (
                <li key={r.id} className="py-2"><div className="text-sm text-white">{r.policy_name || `policy #${r.policy_id}`} <span className="text-teal-400">x{r.matches_count}</span></div><div className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</div></li>
              ))}
            </ul>}
        </div>
      </div>
    </div>
  );
}
