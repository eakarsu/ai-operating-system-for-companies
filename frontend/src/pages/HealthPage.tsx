import { useState, useEffect } from 'react';
import { Plus, Search, Activity } from 'lucide-react';
import { api } from '../api';
import type { HealthScore } from '../types';

function HealthForm({ score, onSave, onCancel }: { score?: HealthScore; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ department: score?.department||'', overall_score: score?.overall_score||75, productivity_score: score?.productivity_score||75, velocity_score: score?.velocity_score||75, quality_score: score?.quality_score||75, collaboration_score: score?.collaboration_score||75, trend: score?.trend||'stable', notes: score?.notes||'', period: score?.period||'' });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { score ? await api.health.update(score.id, form) : await api.health.create(form); onSave(); } catch(err){console.error(err);} };
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">{score ? 'Edit Health Score' : 'New Health Score'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Department</label><select value={form.department} onChange={e=>setForm({...form,department:e.target.value})} className={inp}><option value="">Select...</option>{['Engineering','Sales','Marketing','Customer Success','Product','DevOps','HR','Finance','Operations'].map(d=><option key={d}>{d}</option>)}</select></div>
            <div><label className="block text-sm text-gray-300 mb-1">Trend</label><select value={form.trend} onChange={e=>setForm({...form,trend:e.target.value})} className={inp}>{['improving','stable','declining'].map(t=><option key={t}>{t}</option>)}</select></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Period (e.g., Q4-2025-W1)</label><input value={form.period} onChange={e=>setForm({...form,period:e.target.value})} className={inp} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Overall Score</label><input type="number" min="0" max="100" value={form.overall_score} onChange={e=>setForm({...form,overall_score:Number(e.target.value)})} className={inp} /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Productivity</label><input type="number" min="0" max="100" value={form.productivity_score} onChange={e=>setForm({...form,productivity_score:Number(e.target.value)})} className={inp} /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Velocity</label><input type="number" min="0" max="100" value={form.velocity_score} onChange={e=>setForm({...form,velocity_score:Number(e.target.value)})} className={inp} /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Quality</label><input type="number" min="0" max="100" value={form.quality_score} onChange={e=>setForm({...form,quality_score:Number(e.target.value)})} className={inp} /></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Collaboration</label><input type="number" min="0" max="100" value={form.collaboration_score} onChange={e=>setForm({...form,collaboration_score:Number(e.target.value)})} className={inp} /></div>
          <div><label className="block text-sm text-gray-300 mb-1">Notes</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2} className={inp+" resize-none"} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2 rounded-lg text-sm">Save</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HealthDetail({ score, onEdit, onDelete, onClose }: { score: HealthScore; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  const trendColor: Record<string,string> = { improving:'text-green-400', stable:'text-yellow-400', declining:'text-red-400' };
  const scoreColor = (s: number) => s >= 80 ? 'text-green-400' : s >= 65 ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className="bg-gray-900 border-l border-gray-800 w-96 flex-shrink-0 overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-white text-lg">{score.department}</h2><button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button></div>
        <div className="space-y-3">
          <div className="bg-gray-800 rounded-lg p-4 text-center"><p className="text-gray-400 text-xs mb-1">Overall Score</p><p className={`text-3xl font-bold ${scoreColor(Number(score.overall_score))}`}>{Number(score.overall_score).toFixed(0)}</p><p className={`text-sm mt-1 ${trendColor[score.trend]||'text-white'}`}>{score.trend}</p></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Productivity</p><p className={`text-sm font-medium ${scoreColor(Number(score.productivity_score))}`}>{Number(score.productivity_score).toFixed(0)}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Velocity</p><p className={`text-sm font-medium ${scoreColor(Number(score.velocity_score))}`}>{Number(score.velocity_score).toFixed(0)}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Quality</p><p className={`text-sm font-medium ${scoreColor(Number(score.quality_score))}`}>{Number(score.quality_score).toFixed(0)}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Collaboration</p><p className={`text-sm font-medium ${scoreColor(Number(score.collaboration_score))}`}>{Number(score.collaboration_score).toFixed(0)}</p></div>
          </div>
          {score.period && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Period</p><p className="text-white text-sm">{score.period}</p></div>}
          {score.notes && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Notes</p><p className="text-white text-sm">{score.notes}</p></div>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onEdit} className="flex-1 bg-teal-500 hover:bg-teal-400 text-gray-950 text-sm font-bold py-2 rounded-lg">Edit</button>
          <button onClick={onDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm font-medium py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function HealthPage() {
  const [scores, setScores] = useState<HealthScore[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<HealthScore|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<HealthScore|undefined>(undefined);
  const load = async () => { const d = await api.health.list(); setScores(d); };
  useEffect(()=>{ load(); },[]);
  const handleDelete = async (id: number) => { if(!confirm('Delete?')) return; await api.health.delete(id); setSelected(null); load(); };
  const filtered = scores.filter(s => s.department?.toLowerCase().includes(search.toLowerCase()) || s.period?.toLowerCase().includes(search.toLowerCase()));
  const trendColor: Record<string,string> = { improving:'text-green-400', stable:'text-yellow-400', declining:'text-red-400' };
  const scoreColor = (s: number) => s >= 80 ? 'text-green-400' : s >= 65 ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Health Scores</h1><p className="text-gray-400 text-sm mt-1">{scores.length} department health records</p></div>
          <button onClick={()=>{setEditItem(undefined);setShowForm(true);}} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-gray-950 px-4 py-2 rounded-lg text-sm font-bold"><Plus className="w-4 h-4" />New Score</button>
        </div>
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search departments..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} onClick={()=>setSelected(s)} className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-teal-700 ${selected?.id===s.id?'border-teal-500':'border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center"><Activity className="w-4 h-4 text-teal-400" /></div>
                  <div><div className="font-medium text-white text-sm">{s.department}</div><div className="text-xs text-gray-500">{s.period||'Current'}</div></div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-medium ${trendColor[s.trend]||'text-white'}`}>{s.trend}</span>
                  <div className="text-right"><div className={`text-2xl font-bold ${scoreColor(Number(s.overall_score))}`}>{Number(s.overall_score).toFixed(0)}</div><div className="text-xs text-gray-400">overall</div></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected && <HealthDetail score={selected} onEdit={()=>{setEditItem(selected);setShowForm(true);}} onDelete={()=>handleDelete(selected.id)} onClose={()=>setSelected(null)} />}
      {showForm && <HealthForm score={editItem} onSave={()=>{setShowForm(false);load();}} onCancel={()=>setShowForm(false)} />}
    </div>
  );
}
