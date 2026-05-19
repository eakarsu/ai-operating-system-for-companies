import { useEffect, useState } from 'react';
import { Boxes, RefreshCw } from 'lucide-react';
import { apiFetch } from '../api';
import ProcessActivityChart, { ProcessActivityData } from '../components/ProcessActivityChart';
import ResourceUtilizationHeatmap, { HeatmapData } from '../components/ResourceUtilizationHeatmap';
import OrgChartPdfExport, { OrgChartPdfData } from '../components/OrgChartPdfExport';
import RolePermissionEditor, { RolesData } from '../components/RolePermissionEditor';

type Tab = 'process' | 'heatmap' | 'orgpdf' | 'roles';

export default function CustomViewsPage() {
  const [tab, setTab] = useState<Tab>('process');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [process, setProcess] = useState<ProcessActivityData | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null);
  const [orgPdf, setOrgPdf] = useState<OrgChartPdfData | null>(null);
  const [roles, setRoles] = useState<RolesData | null>(null);

  async function loadAll() {
    setLoading(true); setError('');
    try {
      const [p, h, o, r] = await Promise.all([
        apiFetch('/custom-views/process-activity'),
        apiFetch('/custom-views/resource-utilization'),
        apiFetch('/custom-views/org-chart-pdf'),
        apiFetch('/custom-views/roles')
      ]);
      setProcess(p); setHeatmap(h); setOrgPdf(o); setRoles(r);
    } catch (e: any) { setError(e.message || 'load failed'); }
    finally { setLoading(false); }
  }
  async function reloadRoles() {
    try {
      const r = await apiFetch('/custom-views/roles');
      setRoles(r);
    } catch (e: any) { setError(e.message || 'roles reload failed'); }
  }
  useEffect(() => { loadAll(); }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'process', label: 'Process Activity' },
    { id: 'heatmap', label: 'Resource Heatmap' },
    { id: 'orgpdf', label: 'Org Chart PDF' },
    { id: 'roles', label: 'Roles & Permissions' }
  ];

  return (
    <div className="h-full overflow-y-auto p-6 bg-gray-950 text-white" data-testid="custom-views-page">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-purple-600 flex items-center justify-center">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xl font-semibold">Org Views</div>
            <div className="text-xs text-gray-400">Cross-cutting org views: process activity, resource heatmap, org chart PDF, role editor</div>
          </div>
        </div>
        <button onClick={loadAll} disabled={loading}
          data-testid="org-views-refresh"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading' : 'Refresh All'}
        </button>
      </div>

      <div className="flex gap-1 mb-4 border-b border-gray-800">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            data-testid={`tab-${t.id}`}
            className={`px-3 py-2 text-sm rounded-t-lg border-b-2 transition-colors ${
              tab === t.id
                ? 'text-teal-300 border-teal-400 bg-gray-900'
                : 'text-gray-400 hover:text-white border-transparent'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-3 p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-xs">
          {error}
        </div>
      )}

      {tab === 'process' && process && <ProcessActivityChart data={process} />}
      {tab === 'heatmap' && heatmap && <ResourceUtilizationHeatmap data={heatmap} />}
      {tab === 'orgpdf' && orgPdf && <OrgChartPdfExport data={orgPdf} />}
      {tab === 'roles' && roles && <RolePermissionEditor data={roles} onChange={reloadRoles} />}

      {!loading && !process && !heatmap && !orgPdf && !roles && (
        <div className="text-gray-400 text-sm">No data yet.</div>
      )}
    </div>
  );
}
