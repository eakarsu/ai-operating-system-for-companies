import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { api } from '../api';
import type { SavedQuery } from '../types';

function QueryForm({ query, onSave, onCancel }: { query?: SavedQuery; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: query?.name||'', query_text: query?.query_text||'', query_type: query?.query_type||'natural_language', result_summary: query?.result_summary||'', tags: query?.tags||'', is_scheduled: query?.is_scheduled||false, schedule_frequency: query?.schedule_frequency||'' });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { query ? await api.queries.update(query.id, form) : await api.queries.create(form); onSave(); } catch(err){console.error(err);} };
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">{query ? 'Edit Query' : 'New Query'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-sm text-gray-300 mb-1">Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={inp} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Type</label><select value={form.query_type} onChange={e=>setForm({...form,query_type:e.target.value})} className={inp}>{['natural_language','sql','metric','report'].map(t=><option key={t}>{t}</option>)}</select></div>
            <div><label className="block text-sm text-gray-300 mb-1">Tags</label><input value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} className={inp} placeholder="comma-separated" /></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Query Text</label><textarea value={form.query_text} onChange={e=>setForm({...form,query_text:e.target.value})} rows={3} className={inp+" resize-none"} required /></div>
          <div><label className="block text-sm text-gray-300 mb-1">Result Summary</label><textarea value={form.result_summary} onChange={e=>setForm({...form,result_summary:e.target.value})} rows={2} className={inp+" resize-none"} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 pt-5"><input type="checkbox" checked={form.is_scheduled} onChange={e=>setForm({...form,is_scheduled:e.target.checked})} className="w-4 h-4" /><label className="text-sm text-gray-300">Scheduled</label></div>
            {form.is_scheduled && <div><label className="block text-sm text-gray-300 mb-1">Frequency</label><select value={form.schedule_frequency} onChange={e=>setForm({...form,schedule_frequency:e.target.value})} className={inp}><option value="">Select...</option>{['daily','weekly','monthly'].map(f=><option key={f}>{f}</option>)}</select></div>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2 rounded-lg text-sm">Save</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QueryDetail({ query, onEdit, onDelete, onClose }: { query: SavedQuery; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  return (
    <div className="bg-gray-900 border-l border-gray-800 w-96 flex-shrink-0 overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-white text-lg">{query.name}</h2><button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button></div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Type</p><p className="text-teal-400 text-sm">{query.query_type?.replace(/_/g,' ')}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Run Count</p><p className="text-white text-sm">{query.run_count}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Scheduled</p><p className={`text-sm font-medium ${query.is_scheduled?'text-green-400':'text-gray-400'}`}>{query.is_scheduled ? (query.schedule_frequency||'Yes') : 'No'}</p></div>
            {query.last_run_at && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Last Run</p><p className="text-white text-sm">{new Date(query.last_run_at).toLocaleDateString()}</p></div>}
          </div>
          <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Query</p><p className="text-white text-sm">{query.query_text}</p></div>
          {query.result_summary && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Last Result</p><p className="text-white text-sm">{query.result_summary}</p></div>}
          {query.tags && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Tags</p><p className="text-gray-300 text-xs">{query.tags}</p></div>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onEdit} className="flex-1 bg-teal-500 hover:bg-teal-400 text-gray-950 text-sm font-bold py-2 rounded-lg">Edit</button>
          <button onClick={onDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm font-medium py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function QueriesPage() {
  const [queries, setQueries] = useState<SavedQuery[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SavedQuery|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<SavedQuery|undefined>(undefined);
  const load = async () => { const d = await api.queries.list(); setQueries(d); };
  useEffect(()=>{ load(); },[]);
  const handleDelete = async (id: number) => { if(!confirm('Delete?')) return; await api.queries.delete(id); setSelected(null); load(); };
  const filtered = queries.filter(q => q.name?.toLowerCase().includes(search.toLowerCase()) || q.query_text?.toLowerCase().includes(search.toLowerCase()) || q.tags?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Saved Queries</h1><p className="text-gray-400 text-sm mt-1">{queries.filter(q=>q.is_scheduled).length} scheduled queries</p></div>
          <button onClick={()=>{setEditItem(undefined);setShowForm(true);}} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-gray-950 px-4 py-2 rounded-lg text-sm font-bold"><Plus className="w-4 h-4" />New Query</button>
        </div>
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search queries..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
        <div className="space-y-2">
          {filtered.map(q => (
            <div key={q.id} onClick={()=>setSelected(q)} className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-teal-700 ${selected?.id===q.id?'border-teal-500':'border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center"><Search className="w-4 h-4 text-teal-400" /></div>
                  <div><div className="font-medium text-white text-sm">{q.name}</div><div className="text-xs text-gray-500">{q.query_type?.replace(/_/g,' ')} • {q.run_count} runs</div></div>
                </div>
                <div className="flex items-center gap-4">
                  {q.is_scheduled && <span className="text-xs bg-teal-900/50 text-teal-400 px-2 py-0.5 rounded">{q.schedule_frequency}</span>}
                  <div className="text-right"><div className="text-sm font-medium text-white">{q.run_count}</div><div className="text-xs text-gray-400">runs</div></div>
                </div>
              </div>
              {q.result_summary && <p className="text-xs text-gray-500 mt-2 ml-12 truncate">{q.result_summary}</p>}
            </div>
          ))}
        </div>
      </div>
      {selected && <QueryDetail query={selected} onEdit={()=>{setEditItem(selected);setShowForm(true);}} onDelete={()=>handleDelete(selected.id)} onClose={()=>setSelected(null)} />}
      {showForm && <QueryForm query={editItem} onSave={()=>{setShowForm(false);load();}} onCancel={()=>setShowForm(false)} />}
    </div>
  );
}
