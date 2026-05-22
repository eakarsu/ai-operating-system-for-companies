import { useEffect, useState } from 'react';
import { Webhook, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../api';

interface Sub { id: number; slug: string; vendor?: string; description?: string; active: boolean; has_secret: boolean; created_at: string; }
interface Delivery { id: number; subscription_slug: string; event_type?: string; status: string; received_at: string; }

const BASE = '/gap-nonai-webhook-ingest';
const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

export default function GapWebhookIngest() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ slug: '', vendor: '', description: '' });
  const [lastIngestUrl, setLastIngestUrl] = useState<string | null>(null);

  const load = async () => {
    try {
      const s = await apiFetch(`${BASE}/subscriptions`);
      const d = await apiFetch(`${BASE}/deliveries?limit=50`);
      setSubs(s.subscriptions || []); setDeliveries(d.deliveries || []);
    } catch (err) { setError((err as Error).message); }
  };
  useEffect(() => { load(); }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await apiFetch(`${BASE}/subscriptions`, { method: 'POST', body: JSON.stringify(form) });
      setLastIngestUrl(r.ingest_url || null);
      setForm({ slug: '', vendor: '', description: '' });
      load();
    } catch (err) { setError((err as Error).message); }
  };
  const del = async (slug: string) => {
    try { await apiFetch(`${BASE}/subscriptions/${slug}`, { method: 'DELETE' }); load(); }
    catch (err) { setError((err as Error).message); }
  };

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center"><Webhook className="w-5 h-5 text-white" /></div>
        <div><h1 className="text-2xl font-bold text-white">Webhook Ingestion</h1><p className="text-gray-400 text-sm">{subs.length} subscriptions | {deliveries.length} recent deliveries</p></div>
      </div>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-white font-bold mb-3 flex items-center gap-2"><Plus className="w-4 h-4" />New Subscription</h2>
          <form onSubmit={create} className="space-y-2">
            <input className={inp} placeholder="slug (unique)" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} required />
            <input className={inp} placeholder="vendor (stripe, github...)" value={form.vendor} onChange={e=>setForm({...form,vendor:e.target.value})} />
            <input className={inp} placeholder="description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
            <button className="bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm">Create (secret auto-generated)</button>
          </form>
          {lastIngestUrl && <div className="mt-3 text-xs text-teal-400 break-all">Ingest URL: <code>{lastIngestUrl}</code> (post JSON with X-Signature header)</div>}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-white font-bold mb-3">Subscriptions</h2>
          {subs.length === 0 ? <p className="text-gray-500 text-sm">None.</p> :
            <ul className="divide-y divide-gray-800">
              {subs.map(s => (
                <li key={s.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white font-medium">{s.slug} <span className="text-gray-500">({s.vendor || 'generic'})</span></div>
                    <div className="text-xs text-gray-400">{s.has_secret ? 'HMAC enabled' : 'no secret'} | {s.active ? 'active' : 'paused'}</div>
                    <div className="text-xs text-teal-400">/api/gap-nonai-webhook-ingest/in/{s.slug}</div>
                  </div>
                  <button onClick={()=>del(s.slug)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                </li>
              ))}
            </ul>}
        </div>
      </div>

      <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-4 max-w-6xl">
        <h2 className="text-white font-bold mb-3">Recent Deliveries</h2>
        {deliveries.length === 0 ? <p className="text-gray-500 text-sm">No deliveries.</p> :
          <ul className="divide-y divide-gray-800">
            {deliveries.map(d => (
              <li key={d.id} className="py-2 grid grid-cols-4 gap-2 text-sm">
                <span className="text-white">#{d.id}</span>
                <span className="text-teal-400">{d.subscription_slug}</span>
                <span className="text-gray-400">{d.event_type}</span>
                <span className="text-gray-500">{new Date(d.received_at).toLocaleString()} | {d.status}</span>
              </li>
            ))}
          </ul>}
      </div>
    </div>
  );
}
