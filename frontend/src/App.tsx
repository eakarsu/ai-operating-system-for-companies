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
import CustomViewsPage from './pages/CustomViewsPage';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

// Pass 7 — backlog implementation: gap-*/cf-* pages
import GapRbac from './pages/GapRbac';
import GapAlerting from './pages/GapAlerting';
import GapPiiRedaction from './pages/GapPiiRedaction';
import GapTranscripts from './pages/GapTranscripts';
import GapWebhookIngest from './pages/GapWebhookIngest';
import GapConnectors from './pages/GapConnectors';
import GapQuerySuggest from './pages/GapQuerySuggest';
import GapSourceOnboardingAgent from './pages/GapSourceOnboardingAgent';
import CfSelfImprovingQueries from './pages/CfSelfImprovingQueries';
import PolicyDriftSimulator from './pages/PolicyDriftSimulator';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/insights/timeline" element={<TimelineView />} />
        <Route path="/codex/custom-viz" element={<CodexCustomVizFeature />} />
        <Route path="/codex/operations" element={<CodexOperationsFeature />} />

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
                <Route path="/custom-views" element={<CustomViewsPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/export" element={<ExportPage />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route path="/sample-data" element={<SampleDataPage />} />
                {/* Pass 7 — backlog implementation */}
                <Route path="/rbac" element={<GapRbac />} />
                <Route path="/alerting" element={<GapAlerting />} />
                <Route path="/pii-redaction" element={<GapPiiRedaction />} />
                <Route path="/transcripts" element={<GapTranscripts />} />
                <Route path="/webhook-ingest" element={<GapWebhookIngest />} />
                <Route path="/connector-scripts" element={<GapConnectors />} />
                <Route path="/query-suggest" element={<GapQuerySuggest />} />
                <Route path="/source-onboarding" element={<GapSourceOnboardingAgent />} />
                <Route path="/self-improving-queries" element={<CfSelfImprovingQueries />} />
                <Route path="/policy-drift" element={<PolicyDriftSimulator />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
