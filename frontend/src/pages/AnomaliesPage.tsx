import { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import type { Anomaly, DataSource } from '../types';

function AnomalyForm({ anomaly, sources, onSave, onCancel }: { anomaly?: Anomaly; sources: DataSource[]; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ source_id: anomaly?.source_id||'', metric_name: anomaly?.metric_name||'', expected_value: anomaly?.expected_value||'', actual_value: anomaly?.actual_value||'', deviation_pct: anomaly?.deviation_pct||'', severity: anomaly?.severity||'medium', description: anomaly?.description||'', status: anomaly?.status||'open' });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { anomaly ? await api.anomalies.update(anomaly.id, form) : await api.anomalies.create(form); onSave(); } catch(err){console.error(err);} };
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">{anomaly ? 'Edit Anomaly' : 'New Anomaly'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-sm text-gray-300 mb-1">Metric Name</label><input value={form.metric_name} onChange={e=>setForm({...form,metric_name:e.target.value})} className={inp} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Severity</label><select value={form.severity} onChange={e=>setForm({...form,severity:e.target.value})} className={inp}>{['critical','high','medium','low'].map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm text-gray-300 mb-1">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className={inp}>{['open','investigating','resolved','monitoring'].map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Source</label><select value={form.source_id} onChange={e=>setForm({...form,source_id:Number(e.target.value)})} className={inp}><option value="">None</option>{sources.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Expected</label><input type="number" value={form.expected_value} onChange={e=>setForm({...form,expected_value:e.target.value})} className={inp} /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Actual</label><input type="number" value={form.actual_value} onChange={e=>setForm({...form,actual_value:e.target.value})} className={inp} /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Deviation %</label><input type="number" value={form.deviation_pct} onChange={e=>setForm({...form,deviation_pct:e.target.value})} className={inp} /></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Description</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} className={inp+" resize-none"} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2 rounded-lg text-sm">Save</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AnomalyDetail({ anomaly, onEdit, onDelete, onClose }: { anomaly: Anomaly; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  const sevColor: Record<string,string> = { critical:'text-red-400', high:'text-orange-400', medium:'text-yellow-400', low:'text-green-400' };
  const statusColor: Record<string,string> = { open:'text-red-400', investigating:'text-yellow-400', resolved:'text-green-400', monitoring:'text-blue-400' };
  const dev = Number(anomaly.deviation_pct);
  return (
    <div className="bg-gray-900 border-l border-gray-800 w-96 flex-shrink-0 overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-white text-lg">{anomaly.metric_name}</h2><button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button></div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Severity</p><p className={`text-sm font-medium ${sevColor[anomaly.severity]||'text-white'}`}>{anomaly.severity}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Status</p><p className={`text-sm font-medium ${statusColor[anomaly.status]||'text-white'}`}>{anomaly.status}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Expected</p><p className="text-white text-sm">{Number(anomaly.expected_value).toLocaleString()}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Actual</p><p className="text-white text-sm">{Number(anomaly.actual_value).toLocaleString()}</p></div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Deviation</p><p className={`text-lg font-bold ${Math.abs(dev)>100?'text-red-400':Math.abs(dev)>50?'text-orange-400':'text-yellow-400'}`}>{dev>0?'+':''}{dev.toFixed(1)}%</p></div>
          {anomaly.source_name && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Source</p><p className="text-teal-400 text-sm">{anomaly.source_name}</p></div>}
          {anomaly.description && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Description</p><p className="text-white text-sm">{anomaly.description}</p></div>}
          {anomaly.detected_at && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Detected</p><p className="text-white text-sm">{new Date(anomaly.detected_at).toLocaleString()}</p></div>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onEdit} className="flex-1 bg-teal-500 hover:bg-teal-400 text-gray-950 text-sm font-bold py-2 rounded-lg">Edit</button>
          <button onClick={onDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm font-medium py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [sources, setSources] = useState<DataSource[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Anomaly|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Anomaly|undefined>(undefined);
  const load = async () => { const [a,s] = await Promise.all([api.anomalies.list(), api.sources.list()]); setAnomalies(a); setSources(s); };
  useEffect(()=>{ load(); },[]);
  const handleDelete = async (id: number) => { if(!confirm('Delete?')) return; await api.anomalies.delete(id); setSelected(null); load(); };
  const filtered = anomalies.filter(a => a.metric_name?.toLowerCase().includes(search.toLowerCase()) || a.source_name?.toLowerCase().includes(search.toLowerCase()) || a.severity?.toLowerCase().includes(search.toLowerCase()));
  const sevColor: Record<string,string> = { critical:'text-red-400', high:'text-orange-400', medium:'text-yellow-400', low:'text-green-400' };
  const statusColor: Record<string,string> = { open:'text-red-400', investigating:'text-yellow-400', resolved:'text-green-400', monitoring:'text-blue-400' };
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Anomalies</h1><p className="text-gray-400 text-sm mt-1">{anomalies.filter(a=>a.status==='open').length} open anomalies</p></div>
          <button onClick={()=>{setEditItem(undefined);setShowForm(true);}} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-gray-950 px-4 py-2 rounded-lg text-sm font-bold"><Plus className="w-4 h-4" />New Anomaly</button>
        </div>
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search anomalies..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
        <div className="space-y-2">
          {filtered.map(a => {
            const dev = Number(a.deviation_pct);
            return (
              <div key={a.id} onClick={()=>setSelected(a)} className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-teal-700 ${selected?.id===a.id?'border-teal-500':'border-gray-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center"><AlertTriangle className={`w-4 h-4 ${sevColor[a.severity]||'text-white'}`} /></div>
                    <div><div className="font-medium text-white text-sm">{a.metric_name}</div><div className="text-xs text-gray-500">{a.source_name||'—'}</div></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-xs font-medium ${sevColor[a.severity]||'text-white'}`}>{a.severity}</span>
                    <span className={`text-xs font-medium ${statusColor[a.status]||'text-white'}`}>{a.status}</span>
                    <div className="text-right"><div className={`text-sm font-medium ${Math.abs(dev)>100?'text-red-400':Math.abs(dev)>50?'text-orange-400':'text-yellow-400'}`}>{dev>0?'+':''}{dev.toFixed(1)}%</div><div className="text-xs text-gray-400">deviation</div></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selected && <AnomalyDetail anomaly={selected} onEdit={()=>{setEditItem(selected);setShowForm(true);}} onDelete={()=>handleDelete(selected.id)} onClose={()=>setSelected(null)} />}
      {showForm && <AnomalyForm anomaly={editItem} sources={sources} onSave={()=>{setShowForm(false);load();}} onCancel={()=>setShowForm(false)} />}
    </div>
  );
}
