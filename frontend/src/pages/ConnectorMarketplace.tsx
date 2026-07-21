import { useEffect, useState } from 'react';
import { Plug, RefreshCw, Pause, Play, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../api';

type Connector = {
  id: number; vendor: string; display_name: string; category: string;
  auth_type: string; status: string; health: string;
  last_sync_at: string | null; next_sync_at: string | null;
  records_synced: number; records_failed: number;
  rate_limit_per_min: number; cost_per_month_cents: number;
  owner_department: string | null;
};
type CatalogVendor = { slug: string; category: string; auth: string; tier: string; default_cost_cents: number; };
type CostRow = { vendor: string; display_name: string; cost_per_month_cents: number; records_synced: number; cents_per_1k_records: number | null };

const healthColor: Record<string, string> = {
  green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  yellow: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30',
  red: 'text-red-400 bg-red-500/10 border-red-500/30'
};
const statusBadge: Record<string, string> = {
  connected: 'text-emerald-400', error: 'text-red-400',
  paused: 'text-gray-400', oauth_pending: 'text-yellow-300'
};

export default function ConnectorMarketplace() {
  const [installed, setInstalled] = useState<Connector[]>([]);
  const [catalog, setCatalog] = useState<CatalogVendor[]>([]);
  const [cost, setCost] = useState<{ rows: CostRow[]; totals: { connectors: number; monthly_cents: number; annual_cents: number } } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [installVendor, setInstallVendor] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const [a, b, c] = await Promise.all([
        apiFetch('/cf-connector-marketplace'),
        apiFetch('/cf-connector-marketplace/catalog'),
        apiFetch('/cf-connector-marketplace/cost-report'),
      ]);
      setInstalled(a.connectors);
      setCatalog(b.vendors);
      setCost(c);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function act(path: string, body?: any) {
    try {
      await apiFetch(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
      await load();
    } catch (e: any) { setError(e.message); }
  }

  async function remove(id: number) {
    if (!confirm('Remove this connector?')) return;
    try {
      await apiFetch(`/cf-connector-marketplace/${id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) { setError(e.message); }
  }

  const installedSlugs = new Set(installed.map(c => c.vendor));
  const availableToInstall = catalog.filter(v => !installedSlugs.has(v.slug));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Plug className="w-6 h-6 text-teal-400" />Connector Marketplace</h1>
          <p className="text-gray-400 text-sm mt-1">One-click OAuth for Salesforce, HubSpot, NetSuite, QuickBooks, Slack, Gmail, GitHub, Linear, Stripe, Zendesk and more. Live sync state, cost tracking, pause/resume.</p>
        </div>
        <button onClick={load} disabled={loading} className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-gray-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
          {loading && <RefreshCw className="w-3 h-3 animate-spin" />}Reload
        </button>
      </div>
      {error && <div className="bg-red-900/30 border border-red-700/50 text-red-300 p-3 rounded-lg text-sm mb-4">{error}</div>}

      {cost && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Connectors</div><div className="text-2xl font-bold text-white">{installed.length}</div></div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Healthy (green)</div><div className="text-2xl font-bold text-emerald-400">{installed.filter(c=>c.health==='green').length}</div></div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Monthly cost</div><div className="text-2xl font-bold text-white">${(cost.totals.monthly_cents/100).toLocaleString()}</div></div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4"><div className="text-xs text-gray-400">Annualized</div><div className="text-2xl font-bold text-white">${(cost.totals.annual_cents/100).toLocaleString()}</div></div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-teal-400" />Install new connector</h2>
        <div className="flex gap-2 flex-wrap items-center">
          <select value={installVendor} onChange={e=>setInstallVendor(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm flex-1 min-w-[240px]">
            <option value="">Select vendor…</option>
            {availableToInstall.map(v => <option key={v.slug} value={v.slug}>{v.slug} — {v.category} ({v.tier}) · ${(v.default_cost_cents/100).toLocaleString()}/mo</option>)}
          </select>
          <button disabled={!installVendor} onClick={()=>{act('/cf-connector-marketplace/install', { vendor: installVendor }); setInstallVendor('');}} className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-gray-950 text-sm font-semibold px-4 py-1.5 rounded">Install</button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-3">Installed connectors ({installed.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                <th className="py-2 pr-4">Vendor</th><th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Health</th>
                <th className="py-2 pr-4 text-right">Records</th><th className="py-2 pr-4 text-right">Failed</th>
                <th className="py-2 pr-4 text-right">Cost/mo</th><th className="py-2 pr-4">Last sync</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {installed.map(c => (
                <tr key={c.id} className="border-b border-gray-800/60">
                  <td className="py-2 pr-4"><span className="text-white font-medium">{c.display_name}</span><div className="text-xs text-gray-500">{c.vendor} · {c.auth_type}</div></td>
                  <td className="py-2 pr-4 text-gray-300">{c.category}</td>
                  <td className={`py-2 pr-4 ${statusBadge[c.status] || 'text-gray-300'}`}>{c.status}</td>
                  <td className="py-2 pr-4"><span className={`px-2 py-0.5 rounded border text-xs ${healthColor[c.health] || ''}`}>{c.health}</span></td>
                  <td className="py-2 pr-4 text-right text-gray-300">{Number(c.records_synced).toLocaleString()}</td>
                  <td className={`py-2 pr-4 text-right ${c.records_failed > 0 ? 'text-yellow-300' : 'text-gray-500'}`}>{c.records_failed}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">${(c.cost_per_month_cents/100).toLocaleString()}</td>
                  <td className="py-2 pr-4 text-xs text-gray-400">{c.last_sync_at ? new Date(c.last_sync_at).toLocaleString() : '—'}</td>
                  <td className="py-2 pr-2 flex gap-1">
                    <button title="Sync now" onClick={()=>act(`/cf-connector-marketplace/${c.id}/sync`)} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-teal-300"><RefreshCw className="w-3.5 h-3.5" /></button>
                    {c.status === 'paused'
                      ? <button title="Resume" onClick={()=>act(`/cf-connector-marketplace/${c.id}/resume`)} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-emerald-400"><Play className="w-3.5 h-3.5" /></button>
                      : <button title="Pause" onClick={()=>act(`/cf-connector-marketplace/${c.id}/pause`)} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-yellow-300"><Pause className="w-3.5 h-3.5" /></button>}
                    <button title="Remove" onClick={()=>remove(c.id)} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
              {installed.length === 0 && <tr><td colSpan={9} className="py-6 text-center text-gray-500">No connectors installed yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {cost && cost.rows.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mt-6">
          <h2 className="text-lg font-semibold text-white mb-3">Cost breakdown</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-4">Vendor</th><th className="py-2 pr-4 text-right">Monthly</th><th className="py-2 pr-4 text-right">Records</th><th className="py-2 pr-4 text-right">¢ / 1k records</th>
            </tr></thead>
            <tbody>
              {cost.rows.map(r => (
                <tr key={r.vendor} className="border-b border-gray-800/60">
                  <td className="py-2 pr-4 text-white">{r.display_name}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">${(r.cost_per_month_cents/100).toLocaleString()}</td>
                  <td className="py-2 pr-4 text-right text-gray-300">{Number(r.records_synced).toLocaleString()}</td>
                  <td className="py-2 pr-4 text-right text-teal-300">{r.cents_per_1k_records !== null ? r.cents_per_1k_records.toFixed(3) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
