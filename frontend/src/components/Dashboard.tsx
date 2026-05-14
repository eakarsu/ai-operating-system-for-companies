import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Zap, Lightbulb, AlertTriangle, Activity, History, Sparkles, Beaker, LayoutDashboard, ArrowRight } from 'lucide-react';
import { apiFetch } from '../api';

interface ActivityRow {
  id: number;
  user_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  description: string | null;
  created_at: string;
}

interface DashboardStats {
  kpis: {
    data_sources: number;
    events_today: number;
    open_insights: number;
    active_anomalies: number;
    avg_health_score: number;
  };
  recent_activity: ActivityRow[];
}

const KPI_DEFS: Array<{
  key: keyof DashboardStats['kpis'];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  suffix?: string;
}> = [
  { key: 'data_sources',     label: 'Data Sources',     icon: Database,       to: '/sources' },
  { key: 'events_today',     label: 'Events (24h)',     icon: Zap,            to: '/events' },
  { key: 'open_insights',    label: 'Open Insights',    icon: Lightbulb,      to: '/insights' },
  { key: 'active_anomalies', label: 'Active Anomalies', icon: AlertTriangle,  to: '/anomalies' },
  { key: 'avg_health_score', label: 'Avg Health Score', icon: Activity,       to: '/health', suffix: '/100' },
];

const QUICK_ACTIONS: Array<{ label: string; desc: string; to: string; icon: React.ComponentType<{ className?: string }> }> = [
  { label: 'AI Center',   desc: 'Generate insights, narrate query results, forecast KPIs', to: '/ai-center',    icon: Sparkles },
  { label: 'Insights',    desc: 'Review and triage open AI-generated insights',             to: '/insights',     icon: Lightbulb },
  { label: 'Anomalies',   desc: 'Inspect detected metric deviations and resolve them',      to: '/anomalies',    icon: AlertTriangle },
  { label: 'Sample Data', desc: 'Seed entities with realistic demo rows in one click',      to: '/sample-data',  icon: Beaker },
];

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (isNaN(t)) return iso;
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await apiFetch('/dashboard/stats');
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm">Real-time pulse of your CompanyOS intelligence layer</p>
        </div>
      </div>

      {err && (
        <div className="mb-4 px-4 py-2 rounded-lg text-sm font-medium bg-red-900/40 text-red-300 border border-red-700/50">
          {err}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {KPI_DEFS.map(({ key, label, icon: Icon, to, suffix }) => {
          const value = stats?.kpis?.[key];
          return (
            <button
              key={key}
              onClick={() => navigate(to)}
              className="text-left bg-gray-900 border border-gray-800 hover:border-teal-500/50 rounded-xl p-4 transition-colors group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-teal-400" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-teal-400 transition-colors" />
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">
                {loading ? '—' : (value ?? 0)}
                {suffix && <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>}
              </div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent activity */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-teal-400" />
              <h2 className="text-white font-semibold text-sm">Recent Activity</h2>
            </div>
            <button onClick={() => navigate('/activity')} className="text-xs text-teal-400 hover:text-teal-300">
              View all
            </button>
          </div>
          {loading ? (
            <p className="text-gray-500 text-sm py-6 text-center">Loading...</p>
          ) : !stats?.recent_activity?.length ? (
            <p className="text-gray-500 text-sm py-6 text-center">
              No activity yet. Logged actions will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-gray-800">
              {stats.recent_activity.map(row => (
                <li key={row.id} className="py-2.5 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-teal-400 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-sm font-medium">{row.action}</span>
                      {row.entity_type && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 text-teal-400 border border-gray-700">
                          {row.entity_type}{row.entity_id ? ` #${row.entity_id}` : ''}
                        </span>
                      )}
                    </div>
                    {row.description && (
                      <p className="text-gray-400 text-xs mt-0.5 truncate">{row.description}</p>
                    )}
                    <div className="text-gray-600 text-xs mt-0.5">
                      {row.user_email || 'system'} · {timeAgo(row.created_at)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <h2 className="text-white font-semibold text-sm">Quick Actions</h2>
          </div>
          <div className="space-y-2">
            {QUICK_ACTIONS.map(({ label, desc, to, icon: Icon }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="w-full text-left bg-gray-950 hover:bg-gray-800 border border-gray-800 hover:border-teal-500/50 rounded-lg p-3 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-teal-500/20">
                    <Icon className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium">{label}</div>
                    <div className="text-gray-500 text-xs mt-0.5">{desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
