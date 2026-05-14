import { useState, useEffect } from 'react';
import { Plus, Search, Database } from 'lucide-react';
import { api } from '../api';
import type { DataSource } from '../types';

function SourceForm({ source, onSave, onCancel }: { source?: DataSource; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: source?.name||'', type: source?.type||'database', connection_string: source?.connection_string||'', sync_frequency: source?.sync_frequency||'hourly', status: source?.status||'active', description: source?.description||'', owner: source?.owner||'', tags: source?.tags||'' });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { source ? await api.sources.update(source.id, form) : await api.sources.create(form); onSave(); } catch(err){console.error(err);} };
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">{source ? 'Edit Source' : 'New Data Source'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-sm text-gray-300 mb-1">Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={inp} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Type</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} className={inp}>{['database','crm','version_control','project_management','communication','web_analytics','payments','customer_support','marketing_automation','infrastructure','data_warehouse','knowledge_base','calendar','hr','accounting','product_analytics'].map(t=><option key={t}>{t}</option>)}</select></div>
            <div><label className="block text-sm text-gray-300 mb-1">Sync Frequency</label><select value={form.sync_frequency} onChange={e=>setForm({...form,sync_frequency:e.target.value})} className={inp}>{['real_time','every_15_min','every_30_min','hourly','daily','weekly'].map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className={inp}>{['active','inactive','warning','error'].map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label className="block text-sm text-gray-300 mb-1">Connection String</label><input value={form.connection_string} onChange={e=>setForm({...form,connection_string:e.target.value})} className={inp} placeholder="Optional — not stored in plaintext" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Owner</label><input value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})} className={inp} /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Tags</label><input value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} className={inp} placeholder="comma-separated" /></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Description</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={2} className={inp+" resize-none"} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2 rounded-lg text-sm">Save</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SourceDetail({ source, onEdit, onDelete, onClose }: { source: DataSource; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  const statusColor: Record<string,string> = { active:'text-green-400', inactive:'text-gray-400', warning:'text-yellow-400', error:'text-red-400' };
  return (
    <div className="bg-gray-900 border-l border-gray-800 w-96 flex-shrink-0 overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-white text-lg">{source.name}</h2><button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button></div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Type</p><p className="text-teal-400 text-sm">{source.type?.replace(/_/g,' ')}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Status</p><p className={`text-sm font-medium ${statusColor[source.status]||'text-white'}`}>{source.status}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Sync</p><p className="text-white text-sm">{source.sync_frequency?.replace(/_/g,' ')}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Records</p><p className="text-white text-sm">{Number(source.record_count).toLocaleString()}</p></div>
          </div>
          {source.owner && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Owner</p><p className="text-white text-sm">{source.owner}</p></div>}
          {source.last_synced_at && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Last Synced</p><p className="text-white text-sm">{new Date(source.last_synced_at).toLocaleString()}</p></div>}
          {source.description && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Description</p><p className="text-white text-sm">{source.description}</p></div>}
          {source.tags && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Tags</p><p className="text-gray-300 text-xs">{source.tags}</p></div>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onEdit} className="flex-1 bg-teal-500 hover:bg-teal-400 text-gray-950 text-sm font-bold py-2 rounded-lg">Edit</button>
          <button onClick={onDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm font-medium py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function SourcesPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<DataSource|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<DataSource|undefined>(undefined);
  const load = async () => { const d = await api.sources.list(); setSources(d); };
  useEffect(()=>{ load(); },[]);
  const handleDelete = async (id: number) => { if(!confirm('Delete?')) return; await api.sources.delete(id); setSelected(null); load(); };
  const filtered = sources.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.type?.toLowerCase().includes(search.toLowerCase()) || s.owner?.toLowerCase().includes(search.toLowerCase()));
  const statusColor: Record<string,string> = { active:'text-green-400', inactive:'text-gray-400', warning:'text-yellow-400', error:'text-red-400' };
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Data Sources</h1><p className="text-gray-400 text-sm mt-1">{sources.length} connected data sources</p></div>
          <button onClick={()=>{setEditItem(undefined);setShowForm(true);}} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-gray-950 px-4 py-2 rounded-lg text-sm font-bold"><Plus className="w-4 h-4" />New Source</button>
        </div>
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search sources..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} onClick={()=>setSelected(s)} className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-teal-700 ${selected?.id===s.id?'border-teal-500':'border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center"><Database className="w-4 h-4 text-teal-400" /></div>
                  <div><div className="font-medium text-white text-sm">{s.name}</div><div className="text-xs text-gray-500">{s.type?.replace(/_/g,' ')} • {s.owner||'—'}</div></div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-medium ${statusColor[s.status]||'text-white'}`}>{s.status}</span>
                  <div className="text-right"><div className="text-sm font-medium text-white">{Number(s.record_count).toLocaleString()}</div><div className="text-xs text-gray-400">records</div></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected && <SourceDetail source={selected} onEdit={()=>{setEditItem(selected);setShowForm(true);}} onDelete={()=>handleDelete(selected.id)} onClose={()=>setSelected(null)} />}
      {showForm && <SourceForm source={editItem} onSave={()=>{setShowForm(false);load();}} onCancel={()=>setShowForm(false)} />}
    </div>
  );
}
