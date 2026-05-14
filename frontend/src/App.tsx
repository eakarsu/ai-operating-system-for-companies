import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SourcesPage from './pages/SourcesPage';
import EventsPage from './pages/EventsPage';
import InsightsPage from './pages/InsightsPage';
import AnomaliesPage from './pages/AnomaliesPage';
import QueriesPage from './pages/QueriesPage';
import HealthPage from './pages/HealthPage';
import AICenter from './components/AICenter';
import SearchPage from './pages/SearchPage';
import ExportPage from './pages/ExportPage';
import ActivityPage from './pages/ActivityPage';
import SampleDataPage from './pages/SampleDataPage';
// Deep-feature pages (audit 2026-05-14)
import ConnectorMarketplace from './pages/ConnectorMarketplace';
import AgentTaskDispatcher from './pages/AgentTaskDispatcher';
import DecisionReplayPage from './pages/DecisionReplayPage';
import KpiDashboard from './pages/KpiDashboard';
import WorkflowsPage from './pages/WorkflowsPage';
import ClosedLoopTicketsPage from './pages/ClosedLoopTicketsPage';
import IntentGraphPage from './pages/IntentGraphPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/sources" element={<SourcesPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/insights" element={<InsightsPage />} />
                <Route path="/anomalies" element={<AnomaliesPage />} />
                <Route path="/queries" element={<QueriesPage />} />
                <Route path="/health" element={<HealthPage />} />
                <Route path="/ai-center" element={<AICenter />} />
                {/* Deep-feature routes */}
                <Route path="/connectors" element={<ConnectorMarketplace />} />
                <Route path="/agent-dispatcher" element={<AgentTaskDispatcher />} />
                <Route path="/decision-replay" element={<DecisionReplayPage />} />
                <Route path="/kpis" element={<KpiDashboard />} />
                <Route path="/workflows" element={<WorkflowsPage />} />
                <Route path="/tickets" element={<ClosedLoopTicketsPage />} />
                <Route path="/intent-graph" element={<IntentGraphPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/export" element={<ExportPage />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route path="/sample-data" element={<SampleDataPage />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
