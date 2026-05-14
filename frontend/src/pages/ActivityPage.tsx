import { useState, useEffect } from 'react';
import { History, Plus } from 'lucide-react';
import { api } from '../api';

interface ActivityEntry {
  id: number;
  user_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  description: string | null;
  metadata: object | null;
  created_at: string;
}

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterEntity, setFilterEntity] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ action: '', entity_type: '', entity_id: '', description: '' });

  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const params: { entity_type?: string; action?: string } = {};
      if (filterEntity) params.entity_type = filterEntity;
      if (filterAction) params.action = filterAction;
      const data = await api.activity.list(params);
      setItems(data);
    } catch (e) {
      setError((e as Error).message || 'Failed to load');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.activity.create({
        action: form.action,
        entity_type: form.entity_type || undefined,
        entity_id: form.entity_id ? Number(form.entity_id) : undefined,
        description: form.description || undefined,
      });
      setShowForm(false);
      setForm({ action: '', entity_type: '', entity_id: '', description: '' });
      load();
    } catch (err) { setError((err as Error).message); }
  };

  const actionColor = (action: string): string => {
    if (action.includes('create')) return 'text-green-400';
    if (action.includes('delete')) return 'text-red-400';
    if (action.includes('update') || action.includes('edit')) return 'text-yellow-400';
    if (action.includes('login')) return 'text-blue-400';
    return 'text-teal-400';
  };

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center"><History className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-2xl font-bold text-white">Activity Feed</h1><p className="text-gray-400 text-sm">{items.length} recent activities</p></div>
        </div>
        <button onClick={()=>setShowForm(true)} className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-gray-950 px-4 py-2 rounded-lg text-sm font-bold"><Plus className="w-4 h-4" />Log Activity</button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 max-w-4xl">
        <div className="grid grid-cols-3 gap-3">
          <div><label className="block text-xs text-gray-400 mb-1">Entity Type</label><input value={filterEntity} onChange={e=>setFilterEntity(e.target.value)} placeholder="insight, event..." className={inp} /></div>
          <div><label className="block text-xs text-gray-400 mb-1">Action</label><input value={filterAction} onChange={e=>setFilterAction(e.target.value)} placeholder="create, delete..." className={inp} /></div>
          <div className="flex items-end"><button onClick={load} disabled={loading} className="w-full bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2 rounded-lg disabled:opacity-50">{loading ? 'Loading...' : 'Apply Filters'}</button></div>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800 max-w-4xl">
        {items.length === 0 && !loading && <p className="p-6 text-gray-500 text-sm">No activity entries.</p>}
        {items.map(it => (
          <div key={it.id} className="p-4 flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-semibold ${actionColor(it.action)}`}>{it.action}</span>
                {it.entity_type && <span className="text-xs text-gray-400">on {it.entity_type}{it.entity_id ? ` #${it.entity_id}` : ''}</span>}
                {it.user_email && <span className="text-xs text-gray-500">by {it.user_email}</span>}
              </div>
              {it.description && <p className="text-gray-300 text-sm mt-1">{it.description}</p>}
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">{new Date(it.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Log Activity</h2>
            <form onSubmit={submit} className="space-y-3">
              <div><label className="block text-sm text-gray-300 mb-1">Action</label><input value={form.action} onChange={e=>setForm({...form,action:e.target.value})} className={inp} placeholder="create, update, note..." required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-gray-300 mb-1">Entity Type</label><input value={form.entity_type} onChange={e=>setForm({...form,entity_type:e.target.value})} className={inp} placeholder="insight, event..." /></div>
                <div><label className="block text-sm text-gray-300 mb-1">Entity ID</label><input type="number" value={form.entity_id} onChange={e=>setForm({...form,entity_id:e.target.value})} className={inp} /></div>
              </div>
              <div><label className="block text-sm text-gray-300 mb-1">Description</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} className={inp+" resize-none"} /></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2 rounded-lg text-sm">Save</button>
                <button type="button" onClick={()=>setShowForm(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
