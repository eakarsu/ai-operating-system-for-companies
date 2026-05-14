import { useState } from 'react';
import { Database, Zap, Lightbulb, AlertTriangle, Search as SearchIcon, Activity, Beaker } from 'lucide-react';
import { apiFetch } from '../api';

interface Entity {
  key: string;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ENTITIES: Entity[] = [
  { key: 'sources',   label: 'Data Sources',  desc: 'Salesforce, Slack, AWS CloudWatch, GitHub, Stripe, Snowflake, Zendesk, Jira',  icon: Database },
  { key: 'events',    label: 'KPI Events',    desc: 'Deploys, alarms, deal-won, churn risk, incidents, releases, security signals', icon: Zap },
  { key: 'insights',  label: 'Insights',      desc: 'Velocity, pipeline coverage, support backlog, infra cost, NPS findings',     icon: Lightbulb },
  { key: 'anomalies', label: 'Anomalies',     desc: 'Latency p95, MRR drops, ingest lag, ticket spikes, charge-failure rate',     icon: AlertTriangle },
  { key: 'queries',   label: 'Saved Queries', desc: 'NL + SQL business queries with result summaries and schedules',              icon: SearchIcon },
  { key: 'health',    label: 'Health Scores', desc: 'Departmental health: Engineering, Sales, Support, Finance, Product',          icon: Activity },
];

interface ToastMsg { kind: 'ok' | 'err'; text: string; }

export default function SampleDataPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<ToastMsg | null>(null);

  const flash = (msg: ToastMsg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const handleSeed = async (entity: string) => {
    setBusy(entity);
    try {
      const data = await apiFetch(`/admin/sample-data/${entity}`, { method: 'POST' });
      setCounts(c => ({ ...c, [entity]: (c[entity] || 0) + Number(data.inserted || 0) }));
      flash({ kind: 'ok', text: `Inserted ${data.inserted} ${entity} rows` });
    } catch (e) {
      flash({ kind: 'err', text: (e as Error).message || 'Seed failed' });
    } finally { setBusy(null); }
  };

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center"><Beaker className="w-5 h-5 text-white" /></div>
        <div>
          <h1 className="text-2xl font-bold text-white">Sample Data</h1>
          <p className="text-gray-400 text-sm">Seed each entity with 5-10 domain-realistic rows for demos and testing</p>
        </div>
      </div>

      {toast && (
        <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium ${toast.kind === 'ok' ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50' : 'bg-red-900/40 text-red-300 border border-red-700/50'}`}>
          {toast.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl">
        {ENTITIES.map(({ key, label, desc, icon: Icon }) => (
          <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-teal-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <p className="text-white font-medium">{label}</p>
                {counts[key] > 0 && (
                  <span className="text-xs text-teal-400 font-medium flex-shrink-0">+{counts[key]} seeded</span>
                )}
              </div>
              <p className="text-gray-500 text-xs mt-1">{desc}</p>
              <button
                onClick={() => handleSeed(key)}
                disabled={busy === key}
                className="mt-3 flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2 px-3 rounded-lg text-sm disabled:opacity-50">
                {busy === key ? 'Seeding...' : `Seed ${label}`}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-gray-500 text-xs mt-6 max-w-4xl">
        Each click inserts 5-10 fresh rows into the corresponding table. Safe to click multiple times. Calls
        <code className="mx-1 px-1.5 py-0.5 bg-gray-800 rounded text-teal-400">POST /api/admin/sample-data/:entity</code>.
      </p>
    </div>
  );
}
