import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { apiFetch } from '../api';

interface SuggestResp { id: number; suggestions: string[]; llm_used: boolean; sources: { anomalies: number; insights: number; saved_queries: number }; }
interface Recent { id: number; context: string; suggestions: string[]; picked_index?: number; created_at: string; }

const BASE = '/gap-ai-query-suggest';
const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

export default function GapQuerySuggest() {
  const [context, setContext] = useState('');
  const [resp, setResp] = useState<SuggestResp | null>(null);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadRecent = async () => {
    try { const r = await apiFetch(`${BASE}/recent?limit=20`); setRecent(r.recent || []); }
    catch (err) { setError((err as Error).message); }
  };
  useEffect(() => { loadRecent(); }, []);

  const suggest = async () => {
    setBusy(true); setError(null); setResp(null);
    try {
      const r = await apiFetch(`${BASE}/suggest`, { method: 'POST', body: JSON.stringify({ context, limit: 5 }) });
      setResp(r); loadRecent();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  const pick = async (idx: number) => {
    if (!resp) return;
    try { await apiFetch(`${BASE}/${resp.id}/pick`, { method: 'POST', body: JSON.stringify({ picked_index: idx }) }); loadRecent(); }
    catch (err) { setError((err as Error).message); }
  };

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center"><Sparkles className="w-5 h-5 text-white" /></div>
        <div><h1 className="text-2xl font-bold text-white">Next-Best Query Suggester</h1><p className="text-gray-400 text-sm">Mines recent anomalies, insights, and saved queries</p></div>
      </div>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="max-w-4xl bg-gray-900 border border-gray-800 rounded-xl p-4">
        <label className="block text-sm text-gray-300 mb-1">Operator context (optional)</label>
        <textarea className={inp+" resize-none h-24"} placeholder="e.g. board meeting tomorrow, focus on Q2 finance" value={context} onChange={e=>setContext(e.target.value)} />
        <button onClick={suggest} disabled={busy} className="mt-2 bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-50">{busy ? 'Generating...' : 'Suggest 5 Queries'}</button>

        {resp && (
          <div className="mt-4 bg-gray-950 border border-gray-800 rounded p-3">
            <div className="text-xs text-gray-500 mb-2">Pulled from: anomalies={resp.sources.anomalies}, insights={resp.sources.insights}, saved={resp.sources.saved_queries}. LLM: {resp.llm_used ? 'yes' : 'no (deterministic)'}.</div>
            <ol className="space-y-2">
              {resp.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-2"><span className="text-teal-400 font-mono text-xs">{i+1}.</span><span className="text-sm text-gray-200 flex-1">{s}</span><button onClick={()=>pick(i)} className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded">pick</button></li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="mt-4 max-w-4xl bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h2 className="text-white font-bold mb-3">Recent suggestion batches</h2>
        {recent.length === 0 ? <p className="text-gray-500 text-sm">None.</p> :
          <ul className="divide-y divide-gray-800">
            {recent.map(r => (
              <li key={r.id} className="py-2">
                <div className="text-xs text-gray-500">#{r.id} {new Date(r.created_at).toLocaleString()} {r.picked_index !== null && r.picked_index !== undefined ? `(picked #${r.picked_index+1})` : ''}</div>
                <div className="text-xs text-gray-400 mt-1">{(r.suggestions || []).slice(0,2).join(' | ')}</div>
              </li>
            ))}
          </ul>}
      </div>
    </div>
  );
}
