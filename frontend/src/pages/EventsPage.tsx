import { useState, useEffect } from 'react';
import { Plus, Search, Zap } from 'lucide-react';
import { api } from '../api';
import type { Event, DataSource } from '../types';

function EventForm({ event, sources, onSave, onCancel }: { event?: Event; sources: DataSource[]; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ source_id: event?.source_id||'', event_type: event?.event_type||'', title: event?.title||'', description: event?.description||'', severity: event?.severity||'info', status: event?.status||'new' });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { event ? await api.events.update(event.id, form) : await api.events.create(form); onSave(); } catch(err){console.error(err);} };
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">{event ? 'Edit Event' : 'New Event'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-sm text-gray-300 mb-1">Title</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className={inp} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Event Type</label><input value={form.event_type} onChange={e=>setForm({...form,event_type:e.target.value})} className={inp} placeholder="e.g., deployment, deal_closed" /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Source</label><select value={form.source_id} onChange={e=>setForm({...form,source_id:Number(e.target.value)})} className={inp}><option value="">None</option>{sources.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Severity</label><select value={form.severity} onChange={e=>setForm({...form,severity:e.target.value})} className={inp}>{['info','low','medium','high','critical'].map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm text-gray-300 mb-1">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className={inp}>{['new','processed','resolved','ignored'].map(s=><option key={s}>{s}</option>)}</select></div>
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

function EventDetail({ event, onEdit, onDelete, onClose }: { event: Event; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  const sevColor: Record<string,string> = { info:'text-blue-400', low:'text-green-400', medium:'text-yellow-400', high:'text-orange-400', critical:'text-red-400' };
  const statusColor: Record<string,string> = { new:'text-yellow-400', processed:'text-green-400', resolved:'text-blue-400', ignored:'text-gray-400' };
  return (
    <div className="bg-gray-900 border-l border-gray-800 w-96 flex-shrink-0 overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-white text-lg">{event.title}</h2><button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button></div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Severity</p><p className={`text-sm font-medium ${sevColor[event.severity]||'text-white'}`}>{event.severity}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Status</p><p className={`text-sm font-medium ${statusColor[event.status]||'text-white'}`}>{event.status}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Type</p><p className="text-white text-sm">{event.event_type}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Occurred</p><p className="text-white text-sm">{new Date(event.occurred_at).toLocaleString()}</p></div>
          </div>
          {event.source_name && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Source</p><p className="text-teal-400 text-sm">{event.source_name}</p></div>}
          {event.description && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Description</p><p className="text-white text-sm">{event.description}</p></div>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onEdit} className="flex-1 bg-teal-500 hover:bg-teal-400 text-gray-950 text-sm font-bold py-2 rounded-lg">Edit</button>
          <button onClick={onDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm font-medium py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [sources, setSources] = useState<DataSource[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Event|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Event|undefined>(undefined);
  const load = async () => { const [e,s] = await Promise.all([api.events.list(), api.sources.list()]); setEvents(e); setSources(s); };
  useEffect(()=>{ load(); },[]);
  const handleDelete = async (id: number) => { if(!confirm('Delete?')) return; await api.events.delete(id); setSelected(null); load(); };
  const filtered = events.filter(e => e.title?.toLowerCase().includes(search.toLowerCase()) || e.event_type?.toLowerCase().includes(search.toLowerCase()) || e.source_name?.toLowerCase().includes(search.toLowerCase()));
  const sevColor: Record<string,string> = { info:'text-blue-400', low:'text-green-400', medium:'text-yellow-400', high:'text-orange-400', critical:'text-red-400' };
  const statusColor: Record<string,string> = { new:'text-yellow-400', processed:'text-green-400', resolved:'text-blue-400', ignored:'text-gray-400' };
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Events</h1><p className="text-gray-400 text-sm mt-1">{events.length} events tracked</p></div>
          <button onClick={()=>{setEditItem(undefined);setShowForm(true);}} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-gray-950 px-4 py-2 rounded-lg text-sm font-bold"><Plus className="w-4 h-4" />New Event</button>
        </div>
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search events..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
        <div className="space-y-2">
          {filtered.map(e => (
            <div key={e.id} onClick={()=>setSelected(e)} className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-teal-700 ${selected?.id===e.id?'border-teal-500':'border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center"><Zap className={`w-4 h-4 ${sevColor[e.severity]||'text-teal-400'}`} /></div>
                  <div><div className="font-medium text-white text-sm">{e.title}</div><div className="text-xs text-gray-500">{e.event_type} • {e.source_name||'Manual'}</div></div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-medium ${sevColor[e.severity]||'text-white'}`}>{e.severity}</span>
                  <span className={`text-xs font-medium ${statusColor[e.status]||'text-white'}`}>{e.status}</span>
                  <div className="text-xs text-gray-500">{new Date(e.occurred_at).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected && <EventDetail event={selected} onEdit={()=>{setEditItem(selected);setShowForm(true);}} onDelete={()=>handleDelete(selected.id)} onClose={()=>setSelected(null)} />}
      {showForm && <EventForm event={editItem} sources={sources} onSave={()=>{setShowForm(false);load();}} onCancel={()=>setShowForm(false)} />}
    </div>
  );
}
