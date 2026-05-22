import { useEffect, useState } from 'react';
import { Code2, Plus, Trash2, Play } from 'lucide-react';
import { apiFetch } from '../api';

interface Script { id: number; vendor: string; topic?: string; language: string; active: boolean; last_run_at?: string; last_run_status?: string; body_preview?: string; body?: string; }
interface Template { vendor: string; body: string; }

const BASE = '/gap-nonai-connectors';
const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

export default function GapConnectors() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [picked, setPicked] = useState<Script | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ vendor: 'slack', topic: '', language: 'javascript', body: '' });

  const load = async () => {
    try {
      const r = await apiFetch(`${BASE}/`);
      const t = await apiFetch(`${BASE}/templates`);
      setScripts(r.scripts || []); setTemplates(t.templates || []);
    } catch (err) { setError((err as Error).message); }
  };
  useEffect(() => { load(); }, []);

  const open = async (id: number) => {
    try { const r = await apiFetch(`${BASE}/${id}`); setPicked(r.script); }
    catch (err) { setError((err as Error).message); }
  };
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`${BASE}/`, { method: 'POST', body: JSON.stringify(form) });
      setForm({ vendor: 'slack', topic: '', language: 'javascript', body: '' }); load();
    } catch (err) { setError((err as Error).message); }
  };
  const del = async (id: number) => {
    try { await apiFetch(`${BASE}/${id}`, { method: 'DELETE' }); load(); if (picked?.id === id) setPicked(null); }
    catch (err) { setError((err as Error).message); }
  };
  const markRun = async (id: number, status: string) => {
    try { await apiFetch(`${BASE}/${id}/mark-run`, { method: 'POST', body: JSON.stringify({ status }) }); load(); }
    catch (err) { setError((err as Error).message); }
  };
  const useTemplate = (vendor: string) => {
    const t = templates.find(x => x.vendor === vendor);
    if (t) setForm({ ...form, vendor, body: t.body });
  };

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center"><Code2 className="w-5 h-5 text-white" /></div>
        <div><h1 className="text-2xl font-bold text-white">Connector Scripts</h1><p className="text-gray-400 text-sm">{scripts.length} scripts</p></div>
      </div>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-white font-bold mb-3 flex items-center gap-2"><Plus className="w-4 h-4" />New Script</h2>
          <form onSubmit={create} className="space-y-2">
            <div className="flex gap-2">
              <select className={inp} value={form.vendor} onChange={e=>setForm({...form,vendor:e.target.value})}>
                <option>slack</option><option>linear</option><option>github</option><option>gmail</option><option>stripe</option><option>zendesk</option>
              </select>
              <button type="button" onClick={()=>useTemplate(form.vendor)} className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 rounded">Use template</button>
            </div>
            <input className={inp} placeholder="topic (e.g. deploy.notify)" value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})} />
            <textarea className={inp+" h-48 resize-none font-mono text-xs"} placeholder="connector body" value={form.body} onChange={e=>setForm({...form,body:e.target.value})} />
            <button className="bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm">Create</button>
          </form>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          {!picked ? <p className="text-gray-500 text-sm">Select a script.</p> :
            <>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-white font-bold">{picked.vendor} / {picked.topic || '(no topic)'}</h2>
                <div className="flex gap-2">
                  <button onClick={()=>markRun(picked.id, 'ok')} className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded flex items-center gap-1"><Play className="w-3 h-3" />mark ok</button>
                  <button onClick={()=>markRun(picked.id, 'error')} className="text-xs bg-gray-800 hover:bg-gray-700 text-red-400 px-2 py-1 rounded">mark error</button>
                </div>
              </div>
              <div className="text-xs text-gray-500 mb-2">{picked.language} | last_run {picked.last_run_at ? new Date(picked.last_run_at).toLocaleString() : 'never'} ({picked.last_run_status || '-'})</div>
              <pre className="text-xs text-gray-200 bg-gray-950 p-3 rounded overflow-auto max-h-96">{picked.body}</pre>
            </>}
        </div>
      </div>

      <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-4 max-w-6xl">
        <h2 className="text-white font-bold mb-3">All Scripts</h2>
        {scripts.length === 0 ? <p className="text-gray-500 text-sm">None.</p> :
          <ul className="divide-y divide-gray-800">
            {scripts.map(s => (
              <li key={s.id} className="py-2 flex items-center justify-between">
                <button onClick={()=>open(s.id)} className="text-left flex-1">
                  <div className="text-sm text-white font-medium">{s.vendor} <span className="text-gray-500">{s.topic && `/ ${s.topic}`}</span></div>
                  <div className="text-xs text-gray-400">{s.body_preview}</div>
                </button>
                <button onClick={()=>del(s.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>}
      </div>
    </div>
  );
}
