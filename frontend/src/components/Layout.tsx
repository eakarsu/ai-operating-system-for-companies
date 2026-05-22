import { NavLink, useNavigate } from 'react-router-dom';
import { Database, Zap, Lightbulb, AlertTriangle, Search, Activity, Sparkles, Brain, LogOut, FileSpreadsheet, History, Filter, Beaker, LayoutDashboard, Plug, Bot, ScrollText, Workflow, Ticket, Network, Boxes, ShieldCheck, Bell, Lock, Mic, Webhook, Code2, TrendingUp, SlidersHorizontal } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/sources', label: 'Data Sources', icon: Database },
  { to: '/events', label: 'Events', icon: Zap },
  { to: '/insights', label: 'Insights', icon: Lightbulb },
  { to: '/anomalies', label: 'Anomalies', icon: AlertTriangle },
  { to: '/queries', label: 'Queries', icon: Search },
  { to: '/health', label: 'Health Scores', icon: Activity },
];

const opsNavItems = [
  { to: '/kpis', label: 'KPI Registry', icon: Activity },
  { to: '/workflows', label: 'Workflows', icon: Workflow },
  { to: '/tickets', label: 'Closed-Loop Tickets', icon: Ticket },
  { to: '/intent-graph', label: 'Intent Graph', icon: Network },
  { to: '/agent-dispatcher', label: 'Agent Dispatcher', icon: Bot },
  { to: '/decision-replay', label: 'Decision Replay', icon: ScrollText },
  { to: '/connectors', label: 'Connectors', icon: Plug },
  { to: '/custom-views', label: 'Org Views', icon: Boxes },
];

const utilityNavItems = [
  { to: '/search', label: 'Search & Filter', icon: Filter },
  { to: '/export', label: 'CSV Export', icon: FileSpreadsheet },
  { to: '/activity', label: 'Activity Feed', icon: History },
  { to: '/sample-data', label: 'Sample Data', icon: Beaker },
];

// Pass 7 — backlog (gap-* / cf-*) features
const platformNavItems = [
  { to: '/rbac', label: 'RBAC', icon: ShieldCheck },
  { to: '/alerting', label: 'Alerting', icon: Bell },
  { to: '/pii-redaction', label: 'PII Redaction', icon: Lock },
  { to: '/transcripts', label: 'Transcripts', icon: Mic },
  { to: '/webhook-ingest', label: 'Webhook Ingest', icon: Webhook },
  { to: '/connector-scripts', label: 'Connector Scripts', icon: Code2 },
  { to: '/query-suggest', label: 'Query Suggester', icon: Sparkles },
  { to: '/source-onboarding', label: 'Source Onboarding', icon: Plug },
  { to: '/self-improving-queries', label: 'Self-Improving Queries', icon: TrendingUp },
  { to: '/policy-drift', label: 'Policy Drift', icon: SlidersHorizontal },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const logout = () => { localStorage.removeItem('token'); navigate('/login'); };
  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center"><Brain className="w-5 h-5 text-white" /></div>
            <div><div className="font-bold text-white text-base leading-tight">CompanyOS</div><div className="text-xs text-teal-400">AI Intelligence</div></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <Icon className="w-4 h-4 flex-shrink-0" />{label}
            </NavLink>
          ))}
          <div className="pt-4 border-t border-gray-800 mt-2">
            <NavLink to="/ai-center" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
              <Sparkles className="w-4 h-4 flex-shrink-0" />AI Center
            </NavLink>
          </div>
          <div className="pt-4 border-t border-gray-800 mt-2 space-y-0.5">
            <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-gray-500">Operating System</div>
            {opsNavItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />{label}
              </NavLink>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-800 mt-2 space-y-0.5">
            {utilityNavItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />{label}
              </NavLink>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-800 mt-2 space-y-0.5">
            <div className="px-3 pb-1 text-[10px] uppercase tracking-wider text-gray-500">Platform</div>
            {platformNavItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                <Icon className="w-4 h-4 flex-shrink-0" />{label}
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="p-3 border-t border-gray-800">
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white text-sm w-full rounded-lg hover:bg-gray-800 transition-colors">
            <LogOut className="w-4 h-4" />Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
