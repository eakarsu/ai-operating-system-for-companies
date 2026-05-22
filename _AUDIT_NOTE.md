# CompanyOS — Audit Notes

## Feature add (8 features)

Added 5 AI features and 3 utility features. All wired backend + frontend, JWT bearer pattern preserved, 503 returned when `OPENROUTER_API_KEY` is missing/placeholder.

### AI features (backend `routes/ai.js`, frontend `components/AICenter.tsx`)
1. **Cross-source insight generator** — `POST /api/ai/cross-source-insight` body `{source_ids?: number[]}`. Correlates events + anomalies across selected (or all) data sources. Tab "Cross-Source" in AI Center with multi-select source list.
2. **Anomaly clustering** — `POST /api/ai/anomaly-cluster` body `{status?: string}`. Groups anomalies by likely shared root cause and proposes cluster-level mitigation. Tab "Anomaly Clusters" in AI Center.
3. **KPI forecaster** — `POST /api/ai/kpi-forecast` body `{metric: string, horizon?: string}`. Returns point estimate, drivers, risks, confidence. 400 when metric missing. Tab "KPI Forecast".
4. **Weekly executive brief generator** — `POST /api/ai/weekly-brief`. Pulls last 14d insights/events/anomalies/health and drafts a CEO brief. Tab "Weekly Brief".
5. **Query result narrator** — `POST /api/ai/query-narrate` body `{question?, rows: object[]}`. Turns a row set into an executive narrative. Tab "Result Narrator".

### Utility features
6. **CSV export** — `GET /api/export/:resource` (`sources|events|insights|anomalies|queries|health|activity`). New `routes/exportCsv.js`. Frontend `pages/ExportPage.tsx` route `/export` with one-click CSV downloads using auth-bearing fetch + Blob.
7. **Search & filter** — `GET /api/search?q=&entities=&severity=&status=&impact=&category=&department=&from=&to=`. Cross-entity ILIKE search with combinable filters. New `routes/search.js`. Frontend `pages/SearchPage.tsx` route `/search`.
8. **Activity log / feed** — new `activity_log` table (added to `schema.sql`), `routes/activity.js` GET (filterable by entity_type/action/limit) + POST + DELETE. Frontend `pages/ActivityPage.tsx` route `/activity` with filter form and manual log entry modal.

### Files touched / added
- Modified: `backend/server.js` (3 mounts), `backend/routes/ai.js` (503 handling + 5 new endpoints, existing 4 endpoints unchanged behaviorally), `backend/db/schema.sql` (+ activity_log table & indexes), `frontend/src/api.ts`, `frontend/src/App.tsx`, `frontend/src/components/Layout.tsx`, `frontend/src/components/AICenter.tsx`.
- Added: `backend/routes/activity.js`, `backend/routes/exportCsv.js`, `backend/routes/search.js`, `frontend/src/pages/SearchPage.tsx`, `frontend/src/pages/ExportPage.tsx`, `frontend/src/pages/ActivityPage.tsx`.

### Smoke test (port 3016 / 5176, demo@companyos.ai / demo123)
- Login: HTTP 200, token returned
- `GET /api/activity` (empty) -> `[]`, `POST /api/activity` -> 201 with row
- `GET /api/search?q=engineering&entities=insights,events` -> 25 results
- `GET /api/export/insights` -> CSV with header row
- `POST /api/ai/cross-source-insight` (no key) -> HTTP **503** with `{"error":"AI service unavailable: OPENROUTER_API_KEY not configured"}` (same for `anomaly-cluster`, `weekly-brief`, `kpi-forecast`, `query-narrate`)
- `POST /api/ai/kpi-forecast` with no body -> HTTP 400 `metric is required`
- Backend syntax: `node -c` clean on all 5 modified/new route files + server.js
- Frontend: `npx tsc --noEmit` passes (no errors)
- Vite dev server starts on 5176, proxy login works

### Notes
- The 503 path is shared by the four pre-existing AI endpoints (they all use the same `callAI` helper); previously they returned 500. Existing route file structure and existing endpoints were not removed; only error handling was hardened.
- Activity log is intentionally append-only from app code (DELETE allowed for admin cleanup); we did not add automatic logging hooks to other CRUD routes to honor the "don't touch existing working code" rule. Manual entries via UI / `POST /api/activity` work.

## Feature add — Sample Data seeder

Added a Sample Data page and admin endpoint that lets a logged-in user populate each main entity with 5-10 domain-realistic rows on demand for demos and dev testing.

- **Backend**: new `backend/routes/sample_data.js` exposes `POST /api/admin/sample-data/:entity` (JWT-protected). Mounted at `/api/admin` in `server.js`. Supported entities: `sources`, `events`, `insights`, `anomalies`, `queries`, `health` (users / audit_log / activity_log intentionally skipped). Returns `{inserted, entity}`; 400 on unknown entity.
- **Frontend**: new `frontend/src/pages/SampleDataPage.tsx` route `/sample-data` with one button per entity, toast feedback, and a running per-entity counter. Sidebar entry added under utility group with `Beaker` icon. Uses existing `apiFetch` (JWT bearer).
- **Domain content**: Salesforce/Slack/AWS/GitHub/Jira/Stripe/Snowflake/Zendesk sources; deploys, alarms, deal-won, churn-risk, incidents events; velocity/pipeline/backlog/cost/NPS insights; latency/MRR/lag/charge-failure anomalies; per-department health scores; NL+SQL saved queries with summaries.
- **Smoke test (port 3016)**: login 200; `POST /api/admin/sample-data/insights` 200 `{"inserted":6,...}`; `.../sources` 200 `{"inserted":7,...}`; no-token 401; unknown entity 400. `node -c` and `tsc --noEmit` clean.
- **Files**: added `backend/routes/sample_data.js`, `frontend/src/pages/SampleDataPage.tsx`; modified `backend/server.js` (1 mount), `frontend/src/App.tsx` (route), `frontend/src/components/Layout.tsx` (sidebar).

## Feature add — Dashboard landing page

Added a Dashboard as the first sidebar item and post-login landing route, giving users an at-a-glance pulse of the CompanyOS intelligence layer.

- **Backend**: new `backend/routes/dashboard.js` exposes `GET /api/dashboard/stats` (JWT-protected). Aggregates 5 KPIs in parallel + last 10 `activity_log` rows. Mounted at `/api/dashboard` in `server.js` (one new line after `/api/auth`).
- **KPIs**: data_sources (count), events_today (`occurred_at >= NOW() - 24h`), open_insights (status in new/open/in_progress/reviewing), active_anomalies (status=open), avg_health_score (AVG of overall_score, 1 decimal).
- **Frontend**: new `frontend/src/components/Dashboard.tsx`. 5 clickable KPI cards routing to their detail pages, Recent Activity panel with timeAgo formatter linking to `/activity`, Quick Actions panel for AI Center / Insights / Anomalies / Sample Data. Teal/emerald header matches existing pages.
- **Wiring**: `App.tsx` default `/` redirect changed from `/sources` to `/dashboard`, new `/dashboard` route added. `Layout.tsx` `navItems` gets a new first entry `{ to:'/dashboard', label:'Dashboard', icon:LayoutDashboard }` and adds `LayoutDashboard` to the lucide import. No other lines touched.
- **Smoke test (port 3016, demo@companyos.ai / demo123)**: `node -c` clean, `tsc --noEmit` clean, login 200, `GET /api/dashboard/stats` with bearer -> **200** `{"kpis":{"data_sources":82,"events_today":24,"open_insights":55,"active_anomalies":50,"avg_health_score":74.9},"recent_activity":[...]}`; no-token -> **401**. Cleanup with `pkill -9 -f ai-operating-system-for-companies`.
- **Files**: added `backend/routes/dashboard.js`, `frontend/src/components/Dashboard.tsx`; modified `backend/server.js` (1 mount), `frontend/src/App.tsx` (import + route + default redirect), `frontend/src/components/Layout.tsx` (1 nav entry + 1 icon import).

## Apply pass 7 (full backlog implementation)

The remaining unaddressed audit items were the 10 auto-scaffolded `gap-*` and `cf-*`
route files that still carried the `// TODO: configure credentials...` marker and a
single generic `POST /` shape that just forwarded the request body to an LLM.
Pass 7 replaces 9 of them with real DB-backed implementations, wires every page
into `App.tsx` and `Layout.tsx`, and adds the required tables to `schema.sql`.
The 10th scaffold (`cf-embeddings-index`) genuinely needs an embeddings provider
(NEEDS-CREDS) and is intentionally left as-is.

### Backend route rewrites (drop-in replacements, mount points unchanged)
1. **RBAC** — `routes/gap-nonai-rbac.js` — `GET/POST /roles`, `DELETE /roles/:slug`,
   `GET/POST /assignments`, `DELETE /assignments/:id`, `GET /effective/:email`
   (union of permissions across a user's roles).
2. **Alerting** — `routes/gap-nonai-alerting.js` — `GET/POST/PUT/DELETE /rules`,
   `POST /evaluate` (scans last 24h of anomalies/events/health/kpi_snapshots and
   fires `alert_events` based on field/operator/value rules; channel='in_app'
   marks sent immediately, others queued for a worker), `GET /events`,
   `POST /events/:id/ack`.
3. **PII Redaction** — `routes/gap-nonai-pii-redaction.js` — `GET/POST/DELETE /policies`,
   `POST /redact` (runs text through all enabled policies; built-in regex for
   email/phone/ssn/credit_card plus `custom` regex), `GET /redactions`,
   `POST /purge-expired` (honors per-policy `retention_days`).
4. **Transcripts** — `routes/gap-nonai-transcripts.js` — `GET /`, `GET /:id`,
   `POST /ingest` (auto-computes summary/action_items/sentiment via deterministic
   regex extractor, no LLM needed), `POST /:id/summarize`, `DELETE /:id`.
5. **Webhook Ingest** — `routes/gap-nonai-webhook-ingest.js` — public
   `POST /in/:slug` (HMAC-SHA256 verified against stored secret when present;
   promotes payload into `events`), JWT-protected `GET/POST/DELETE /subscriptions`
   (auto-generates secret if not supplied), `GET /deliveries`, `GET /deliveries/:id`.
6. **Connector Scripts** — `routes/gap-nonai-connectors.js` — `GET /templates`
   (built-in slack/linear/github/gmail snippets), full CRUD on `connector_scripts`,
   `POST /:id/mark-run`.
7. **Query Suggester (AI)** — `routes/gap-ai-query-suggest.js` —
   `POST /suggest` mines `saved_queries` + open `anomalies` + recent `insights`
   to seed 5 next-best questions; LLM re-ranks/rewrites when
   `OPENROUTER_API_KEY` is set, otherwise deterministic seeds are returned.
   `POST /:id/pick` records which suggestion was chosen. `GET /recent`.
8. **Source Onboarding (AI)** — `routes/gap-ai-source-onboarding-agent.js` —
   `POST /plan` returns an 8-step ordered plan derived from a built-in vendor
   catalog (auth/scopes/cadence/dept/kpi hints for 15 vendors); LLM enriches
   rationale/risks when keys are configured. `GET /plans`, `GET /plans/:id`,
   `POST /plans/:id/status` (draft|approved|executing|done|abandoned).
9. **Self-Improving Queries** — `routes/cf-self-improving-queries.js` —
   `POST /feedback` (rating, was_useful, comment, optional improved_text against
   a real `saved_queries.id`), `GET /feedback/:query_id`, `POST /apply/:feedback_id`
   (copies improved_text back into `saved_queries.query_text`), `GET /library`
   (per-query stats + rework candidates and top-rated), `GET /pending`.

### Tables added (CREATE TABLE IF NOT EXISTS in both `schema.sql` and per-route `ensureTables()`)
`roles`, `user_roles`, `alert_rules`, `alert_events`, `pii_policies`,
`pii_redactions`, `transcripts`, `webhook_subscriptions`, `webhook_deliveries`,
`connector_scripts`, `query_suggestions`, `source_onboarding_plans`,
`query_feedback`. Indexes on hot columns (created_at DESC, entity ids, fkeys).

### Frontend pages rewritten (same filenames; replace the generic scaffold)
`GapRbac`, `GapAlerting`, `GapPiiRedaction`, `GapTranscripts`, `GapWebhookIngest`,
`GapConnectors`, `GapQuerySuggest`, `GapSourceOnboardingAgent`,
`CfSelfImprovingQueries`. All use the existing `apiFetch` JWT bearer pattern,
match the dark-teal CompanyOS look (gray-900/teal-500), and exercise the real
new endpoints (no more `{note: input}` echo). `App.tsx` gains 9 new routes;
`Layout.tsx` gains a new "Platform" sidebar group with all 9 entries (icons
added to the lucide import).

### Constraints met
- No new npm dependencies (`crypto` is built-in; everything else was already in use).
- `backend/server.js` untouched (the mounts for these 10 routes existed since the
  initial commit on lines 25-40; no 404 handler exists, so nothing to re-order).
- `node --check` clean on every modified `.js` file (server.js + 9 routes).
- `npx tsc --noEmit` reports only pre-existing unused-import warnings in files
  I did not touch (CodexCustomVizFeature, ConnectorMarketplace, IntentGraphPage,
  TimelineView, WorkflowsPage); the 9 new TSX files have zero new errors.
- `cf-embeddings-index` (NEEDS-CREDS: needs an embeddings API + vector store)
  intentionally left untouched as the only remaining scaffold; documented here.

## Feature add — Sample-prefill buttons on AI feature forms

Added 2-3 sample-prefill buttons at the top of every AI form in `frontend/src/components/AICenter.tsx`. All AI features live as tabs in this single component (no per-page abstraction), so samples were added inline via a local `SampleBar` helper + per-tab `*Samples` arrays declared once at the top of the component.

- **Tabs covered**: Generate Insights, NL Query, Anomaly Explain, Health Analysis, Cross-Source, Anomaly Clusters, KPI Forecast, Result Narrator (8 of 9; Weekly Brief is a button-only form with no inputs and was skipped intentionally).
- **Realistic data**: scenarios reference Salesforce / Slack / AWS CloudWatch / GitHub / Stripe / Zendesk / Jira and KPI events (deploys, alarms, deal-won, churn, MRR). Anomaly samples include a p95 latency spike (180→810ms) coinciding with a payments-service deploy, and a Stripe charge_failed burst clustered on one card network. Insights samples cover engineering velocity decline and top-3 customer revenue concentration. Narrator samples populate full JSON row arrays.
- **Cross-Source** tab buttons filter the dynamically-loaded `sources` list by regex ("Deploy x Alarm" picks GitHub/AWS/CloudWatch, "Revenue x Comms" picks Salesforce/Stripe/Slack, "All sources" clears selection).
- **Constraint**: existing form submit handlers, state, and API calls untouched; no new files; no npm install.
- **Smoke test (port 3016 / 5176, demo@companyos.ai / demo123)**: backend up, login 200 with JWT, Vite v4.5.14 dev server up, `GET /src/components/AICenter.tsx` -> 200 (107KB transformed bundle, contains new symbols), `npx tsc --noEmit` clean. Cleanup with `pkill -9 -f ai-operating-system-for-companies`.
- **Files**: modified only `frontend/src/components/AICenter.tsx`.
