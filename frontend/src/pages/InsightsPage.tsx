import { useState, useEffect } from 'react';
import { Plus, Search, Lightbulb } from 'lucide-react';
import { api } from '../api';
import type { Insight } from '../types';

function InsightForm({ insight, onSave, onCancel }: { insight?: Insight; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ title: insight?.title||'', category: insight?.category||'operational', content: insight?.content||'', confidence_score: insight?.confidence_score||75, impact: insight?.impact||'medium', action_required: insight?.action_required||false, assigned_to: insight?.assigned_to||'', status: insight?.status||'new', tags: insight?.tags||'' });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { insight ? await api.insights.update(insight.id, form) : await api.insights.create(form); onSave(); } catch(err){console.error(err);} };
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">{insight ? 'Edit Insight' : 'New Insight'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-sm text-gray-300 mb-1">Title</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className={inp} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Category</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className={inp}>{['operational','financial','marketing','sales','product','people','engineering'].map(c=><option key={c}>{c}</option>)}</select></div>
            <div><label className="block text-sm text-gray-300 mb-1">Impact</label><select value={form.impact} onChange={e=>setForm({...form,impact:e.target.value})} className={inp}>{['critical','high','medium','low'].map(i=><option key={i}>{i}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className={inp}>{['new','in_review','processed','archived'].map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm text-gray-300 mb-1">Confidence %</label><input type="number" min="0" max="100" value={form.confidence_score} onChange={e=>setForm({...form,confidence_score:Number(e.target.value)})} className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Assigned To</label><input value={form.assigned_to} onChange={e=>setForm({...form,assigned_to:e.target.value})} className={inp} /></div>
            <div className="flex items-center gap-2 pt-6"><input type="checkbox" checked={form.action_required} onChange={e=>setForm({...form,action_required:e.target.checked})} className="w-4 h-4" /><label className="text-sm text-gray-300">Action Required</label></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Content</label><textarea value={form.content} onChange={e=>setForm({...form,content:e.target.value})} rows={4} className={inp+" resize-none"} /></div>
          <div><label className="block text-sm text-gray-300 mb-1">Tags</label><input value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} className={inp} placeholder="comma-separated" /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2 rounded-lg text-sm">Save</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InsightDetail({ insight, onEdit, onDelete, onClose }: { insight: Insight; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  const impactColor: Record<string,string> = { critical:'text-red-400', high:'text-orange-400', medium:'text-yellow-400', low:'text-green-400' };
  const statusColor: Record<string,string> = { new:'text-yellow-400', in_review:'text-blue-400', processed:'text-green-400', archived:'text-gray-400' };
  return (
    <div className="bg-gray-900 border-l border-gray-800 w-96 flex-shrink-0 overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-white text-lg">{insight.title}</h2><button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button></div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Impact</p><p className={`text-sm font-medium ${impactColor[insight.impact]||'text-white'}`}>{insight.impact}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Status</p><p className={`text-sm font-medium ${statusColor[insight.status]||'text-white'}`}>{insight.status?.replace(/_/g,' ')}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Category</p><p className="text-teal-400 text-sm">{insight.category}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Confidence</p><p className="text-white text-sm">{Number(insight.confidence_score).toFixed(0)}%</p></div>
          </div>
          {insight.assigned_to && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Assigned To</p><p className="text-white text-sm">{insight.assigned_to}</p></div>}
          {insight.action_required && <div className="bg-orange-900/30 border border-orange-700/50 rounded-lg p-3 text-orange-300 text-sm font-medium">Action Required</div>}
          {insight.content && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Content</p><p className="text-white text-sm">{insight.content}</p></div>}
          {insight.tags && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Tags</p><p className="text-gray-300 text-xs">{insight.tags}</p></div>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onEdit} className="flex-1 bg-teal-500 hover:bg-teal-400 text-gray-950 text-sm font-bold py-2 rounded-lg">Edit</button>
          <button onClick={onDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm font-medium py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Insight|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Insight|undefined>(undefined);
  const load = async () => { const d = await api.insights.list(); setInsights(d); };
  useEffect(()=>{ load(); },[]);
  const handleDelete = async (id: number) => { if(!confirm('Delete?')) return; await api.insights.delete(id); setSelected(null); load(); };
  const filtered = insights.filter(i => i.title?.toLowerCase().includes(search.toLowerCase()) || i.category?.toLowerCase().includes(search.toLowerCase()) || i.assigned_to?.toLowerCase().includes(search.toLowerCase()));
  const impactColor: Record<string,string> = { critical:'text-red-400', high:'text-orange-400', medium:'text-yellow-400', low:'text-green-400' };
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Insights</h1><p className="text-gray-400 text-sm mt-1">{insights.filter(i=>i.action_required).length} requiring action</p></div>
          <button onClick={()=>{setEditItem(undefined);setShowForm(true);}} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-gray-950 px-4 py-2 rounded-lg text-sm font-bold"><Plus className="w-4 h-4" />New Insight</button>
        </div>
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search insights..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
        <div className="space-y-2">
          {filtered.map(i => (
            <div key={i.id} onClick={()=>setSelected(i)} className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-teal-700 ${selected?.id===i.id?'border-teal-500':'border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center"><Lightbulb className={`w-4 h-4 ${impactColor[i.impact]||'text-teal-400'}`} /></div>
                  <div><div className="font-medium text-white text-sm">{i.title}</div><div className="text-xs text-gray-500">{i.category} • {i.assigned_to||'Unassigned'}</div></div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-medium ${impactColor[i.impact]||'text-white'}`}>{i.impact}</span>
                  {i.action_required && <span className="text-xs bg-orange-900/50 text-orange-400 px-2 py-0.5 rounded">Action</span>}
                  <div className="text-right"><div className="text-sm font-medium text-white">{Number(i.confidence_score).toFixed(0)}%</div><div className="text-xs text-gray-400">confidence</div></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected && <InsightDetail insight={selected} onEdit={()=>{setEditItem(selected);setShowForm(true);}} onDelete={()=>handleDelete(selected.id)} onClose={()=>setSelected(null)} />}
      {showForm && <InsightForm insight={editItem} onSave={()=>{setShowForm(false);load();}} onCancel={()=>setShowForm(false)} />}
    </div>
  );
}
