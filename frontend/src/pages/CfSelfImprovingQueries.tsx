import { useEffect, useState } from 'react';
import { TrendingUp, Check } from 'lucide-react';
import { apiFetch } from '../api';

interface LibraryRow { id: number; name: string; query_type: string; run_count?: number; feedback_count: number; avg_rating?: number; useful_count: number; pending_improvements: number; }
interface PendingRow { id: number; query_id: number; query_name: string; current_text: string; improved_text: string; comment?: string; rating?: number; created_at: string; }

const BASE = '/cf-self-improving-queries';
const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

export default function CfSelfImprovingQueries() {
  const [lib, setLib] = useState<LibraryRow[]>([]);
  const [rework, setRework] = useState<LibraryRow[]>([]);
  const [top, setTop] = useState<LibraryRow[]>([]);
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ query_id: '', rating: 4, was_useful: true, comment: '', improved_text: '' });

  const load = async () => {
    try {
      const l = await apiFetch(`${BASE}/library`);
      const p = await apiFetch(`${BASE}/pending`);
      setLib(l.queries || []); setRework(l.rework_candidates || []); setTop(l.top_rated || []);
      setPending(p.pending || []);
    } catch (err) { setError((err as Error).message); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`${BASE}/feedback`, { method: 'POST', body: JSON.stringify({
        ...form, query_id: Number(form.query_id), rating: Number(form.rating)
      }) });
      setForm({ query_id: '', rating: 4, was_useful: true, comment: '', improved_text: '' });
      load();
    } catch (err) { setError((err as Error).message); }
  };
  const apply = async (id: number) => {
    try { await apiFetch(`${BASE}/apply/${id}`, { method: 'POST', body: '{}' }); load(); }
    catch (err) { setError((err as Error).message); }
  };

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5 text-white" /></div>
        <div><h1 className="text-2xl font-bold text-white">Self-Improving Query Library</h1><p className="text-gray-400 text-sm">{lib.length} queries | {pending.length} pending improvements</p></div>
      </div>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-white font-bold mb-3">Submit Feedback</h2>
          <form onSubmit={submit} className="space-y-2">
            <select className={inp} value={form.query_id} onChange={e=>setForm({...form,query_id:e.target.value})} required>
              <option value="">-- pick saved query --</option>
              {lib.map(q => <option key={q.id} value={q.id}>#{q.id} {q.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input className={inp} type="number" min={1} max={5} placeholder="rating (1-5)" value={form.rating} onChange={e=>setForm({...form,rating:Number(e.target.value)})} />
              <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={form.was_useful} onChange={e=>setForm({...form,was_useful:e.target.checked})} />was useful?</label>
            </div>
            <input className={inp} placeholder="comment" value={form.comment} onChange={e=>setForm({...form,comment:e.target.value})} />
            <textarea className={inp+" h-24 resize-none font-mono text-xs"} placeholder="improved_text (optional - proposes a better version)" value={form.improved_text} onChange={e=>setForm({...form,improved_text:e.target.value})} />
            <button className="bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm">Submit Feedback</button>
          </form>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-white font-bold mb-3">Top Rated / Rework Candidates</h2>
          <div className="mb-3">
            <div className="text-xs text-teal-400 uppercase mb-1">Top rated</div>
            {top.length ? top.map(q => <div key={q.id} className="text-xs text-gray-300">#{q.id} {q.name} <span className="text-teal-400">{q.avg_rating}</span></div>) : <div className="text-xs text-gray-500">none</div>}
          </div>
          <div>
            <div className="text-xs text-red-400 uppercase mb-1">Rework candidates</div>
            {rework.length ? rework.map(q => <div key={q.id} className="text-xs text-gray-300">#{q.id} {q.name} <span className="text-red-400">{q.avg_rating}</span></div>) : <div className="text-xs text-gray-500">none</div>}
          </div>
        </div>
      </div>

      <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-4 max-w-6xl">
        <h2 className="text-white font-bold mb-3">Pending Improvements</h2>
        {pending.length === 0 ? <p className="text-gray-500 text-sm">Nothing pending.</p> :
          <ul className="space-y-3">
            {pending.map(p => (
              <li key={p.id} className="bg-gray-950 border border-gray-800 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-white font-medium">#{p.query_id} {p.query_name} {p.rating ? <span className="text-teal-400">★{p.rating}</span> : null}</div>
                  <button onClick={()=>apply(p.id)} className="text-xs bg-teal-500 text-gray-950 font-bold px-3 py-1 rounded flex items-center gap-1"><Check className="w-3 h-3" />Apply</button>
                </div>
                {p.comment && <div className="text-xs text-gray-400 italic mb-2">{p.comment}</div>}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><div className="text-gray-500 mb-1">current:</div><pre className="text-gray-300 whitespace-pre-wrap">{p.current_text}</pre></div>
                  <div><div className="text-teal-400 mb-1">proposed:</div><pre className="text-teal-200 whitespace-pre-wrap">{p.improved_text}</pre></div>
                </div>
              </li>
            ))}
          </ul>}
      </div>
    </div>
  );
}
