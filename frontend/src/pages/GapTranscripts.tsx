import { useEffect, useState } from 'react';
import { Mic, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../api';

interface TranscriptListRow { id: number; source: string; title: string; participants?: string; meeting_at?: string; duration_min?: number; sentiment?: string; tags?: string; summary_preview?: string; created_at: string; }
interface Transcript extends TranscriptListRow { body: string; summary?: string; action_items?: string; }

const BASE = '/gap-nonai-transcripts';
const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

export default function GapTranscripts() {
  const [items, setItems] = useState<TranscriptListRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showIngest, setShowIngest] = useState(false);
  const [form, setForm] = useState({ source: 'manual', title: '', participants: '', meeting_at: '', duration_min: 30, body: '' });
  const [picked, setPicked] = useState<Transcript | null>(null);

  const load = async () => {
    try { const r = await apiFetch(`${BASE}/?limit=50`); setItems(r.transcripts || []); }
    catch (err) { setError((err as Error).message); }
  };
  useEffect(() => { load(); }, []);

  const ingest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`${BASE}/ingest`, { method: 'POST', body: JSON.stringify({
        ...form, duration_min: Number(form.duration_min) || undefined,
        meeting_at: form.meeting_at || undefined,
        participants: form.participants.split(',').map(s=>s.trim()).filter(Boolean)
      }) });
      setShowIngest(false); setForm({ source: 'manual', title: '', participants: '', meeting_at: '', duration_min: 30, body: '' }); load();
    } catch (err) { setError((err as Error).message); }
  };
  const del = async (id: number) => {
    try { await apiFetch(`${BASE}/${id}`, { method: 'DELETE' }); load(); if (picked?.id === id) setPicked(null); }
    catch (err) { setError((err as Error).message); }
  };
  const open = async (id: number) => {
    try { const r = await apiFetch(`${BASE}/${id}`); setPicked(r.transcript); }
    catch (err) { setError((err as Error).message); }
  };
  const summarize = async (id: number) => {
    try { const r = await apiFetch(`${BASE}/${id}/summarize`, { method: 'POST', body: '{}' }); setPicked(r.transcript); load(); }
    catch (err) { setError((err as Error).message); }
  };

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center"><Mic className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-white">Call / Transcript Ingest</h1><p className="text-gray-400 text-sm">{items.length} transcripts</p></div>
        </div>
        <button onClick={()=>setShowIngest(true)} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-gray-950 px-4 py-2 rounded-lg text-sm font-bold"><Plus className="w-4 h-4" />Ingest Transcript</button>
      </div>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl">
        <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
          {items.length === 0 && <p className="p-6 text-gray-500 text-sm">No transcripts yet.</p>}
          {items.map(t => (
            <div key={t.id} className="p-3 flex items-start justify-between gap-3">
              <button onClick={()=>open(t.id)} className="text-left flex-1">
                <div className="text-sm text-white font-medium">{t.title}</div>
                <div className="text-xs text-gray-400">{t.source} | {t.duration_min ?? '?'}min | sentiment {t.sentiment || 'n/a'}</div>
                {t.summary_preview && <div className="text-xs text-gray-500 mt-1 line-clamp-2">{t.summary_preview}</div>}
              </button>
              <button onClick={()=>del(t.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          {!picked ? <p className="text-gray-500 text-sm">Select a transcript to view.</p> :
            <>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-white font-bold">{picked.title}</h2>
                <button onClick={()=>summarize(picked.id)} className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded">Re-summarize</button>
              </div>
              <div className="text-xs text-gray-500 mb-3">{picked.source} | {picked.participants}</div>
              {picked.summary && <div className="mb-3"><div className="text-xs text-teal-400 uppercase">Summary</div><div className="text-sm text-gray-200 whitespace-pre-wrap">{picked.summary}</div></div>}
              {picked.action_items && <div className="mb-3"><div className="text-xs text-teal-400 uppercase">Action Items</div><pre className="text-sm text-gray-200 whitespace-pre-wrap">{picked.action_items}</pre></div>}
              <details><summary className="text-xs text-gray-500 cursor-pointer">Full body</summary><pre className="text-xs text-gray-400 whitespace-pre-wrap mt-2">{picked.body}</pre></details>
            </>}
        </div>
      </div>

      {showIngest && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <form onSubmit={ingest} className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-2xl space-y-2">
            <h2 className="text-xl font-bold text-white mb-2">Ingest Transcript</h2>
            <div className="grid grid-cols-2 gap-2">
              <select className={inp} value={form.source} onChange={e=>setForm({...form,source:e.target.value})}>
                <option>manual</option><option>gong</option><option>zoom</option><option>meet</option>
              </select>
              <input className={inp} type="number" placeholder="duration_min" value={form.duration_min} onChange={e=>setForm({...form,duration_min:parseInt(e.target.value)||0})} />
            </div>
            <input className={inp} placeholder="title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
            <input className={inp} placeholder="participants (comma-separated)" value={form.participants} onChange={e=>setForm({...form,participants:e.target.value})} />
            <input className={inp} type="datetime-local" value={form.meeting_at} onChange={e=>setForm({...form,meeting_at:e.target.value})} />
            <textarea className={inp+" h-48 resize-none font-mono"} placeholder="transcript body..." value={form.body} onChange={e=>setForm({...form,body:e.target.value})} required />
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2 rounded-lg text-sm">Ingest</button>
              <button type="button" onClick={()=>setShowIngest(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
