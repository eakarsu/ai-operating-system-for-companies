-- Users
INSERT INTO users (email, password_hash, name, role) VALUES
('demo@companyos.ai', '$2b$10$e4dPQpe3XIDluCZCv3b3iu/H/3f816tgim6l5ly5k7pChHG235Dey', 'Demo User', 'admin')
ON CONFLICT (email) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      name = EXCLUDED.name,
      role = EXCLUDED.role;

-- Data Sources
INSERT INTO data_sources (name, type, sync_frequency, status, last_synced_at, record_count, description, owner, tags) VALUES
('Salesforce CRM', 'crm', 'hourly', 'active', NOW() - INTERVAL '5 minutes', 15420, 'Primary CRM with all customer and deal data', 'Sales Team', 'crm,sales,customers'),
('GitHub Repositories', 'version_control', 'real_time', 'active', NOW() - INTERVAL '2 minutes', 8930, 'All engineering repositories and commit activity', 'Engineering', 'code,engineering,velocity'),
('Jira Project Management', 'project_management', 'every_15_min', 'active', NOW() - INTERVAL '8 minutes', 22150, 'Sprint planning, tickets, and backlog', 'Engineering', 'tickets,sprints,planning'),
('Slack Workspace', 'communication', 'real_time', 'active', NOW() - INTERVAL '1 minute', 156780, 'All Slack messages and channel activity', 'Operations', 'communication,teams'),
('Google Analytics', 'web_analytics', 'hourly', 'active', NOW() - INTERVAL '15 minutes', 89320, 'Website traffic and conversion metrics', 'Marketing', 'web,traffic,conversions'),
('Stripe Payments', 'payments', 'real_time', 'active', NOW() - INTERVAL '30 seconds', 34567, 'All payment transactions and subscription data', 'Finance', 'payments,revenue,subscriptions'),
('Zendesk Support', 'customer_support', 'every_15_min', 'active', NOW() - INTERVAL '12 minutes', 18920, 'Support tickets and customer satisfaction scores', 'Customer Success', 'support,tickets,csat'),
('HubSpot Marketing', 'marketing_automation', 'hourly', 'active', NOW() - INTERVAL '25 minutes', 45230, 'Email campaigns and lead generation data', 'Marketing', 'email,leads,campaigns'),
('AWS CloudWatch', 'infrastructure', 'real_time', 'active', NOW() - INTERVAL '45 seconds', 2340000, 'Infrastructure metrics and system health', 'DevOps', 'infrastructure,monitoring'),
('Snowflake Data Warehouse', 'data_warehouse', 'daily', 'active', NOW() - INTERVAL '2 hours', 5670000, 'Consolidated analytical data', 'Data Team', 'analytics,warehouse'),
('Notion Workspace', 'knowledge_base', 'every_30_min', 'active', NOW() - INTERVAL '18 minutes', 3450, 'Company knowledge base and documentation', 'Operations', 'docs,knowledge'),
('Google Calendar', 'calendar', 'real_time', 'active', NOW() - INTERVAL '3 minutes', 12340, 'Team calendar and meeting data', 'Operations', 'meetings,calendar'),
('LinkedIn Recruiting', 'hr', 'daily', 'warning', NOW() - INTERVAL '6 hours', 2340, 'Recruiting pipeline and candidate data', 'HR', 'recruiting,hiring'),
('QuickBooks Accounting', 'accounting', 'daily', 'active', NOW() - INTERVAL '3 hours', 8920, 'Financial transactions and accounting data', 'Finance', 'finance,accounting'),
('Mixpanel Analytics', 'product_analytics', 'hourly', 'active', NOW() - INTERVAL '20 minutes', 123450, 'Product usage and feature adoption metrics', 'Product', 'product,analytics,usage')
ON CONFLICT DO NOTHING;

-- Events
INSERT INTO events (source_id, event_type, title, description, severity, status, occurred_at) VALUES
(1, 'deal_closed', 'Enterprise Deal Closed - Acme Corp', 'Closed $2.4M ARR deal with Acme Corp, Q4 goal exceeded', 'info', 'processed', NOW() - INTERVAL '2 hours'),
(2, 'deployment', 'Production Deployment v2.8.1', 'Successful deployment of payment module update', 'info', 'processed', NOW() - INTERVAL '4 hours'),
(3, 'sprint_completed', 'Sprint 47 Completed - 94% velocity', 'Engineering team completed sprint with 94% story point completion', 'info', 'processed', NOW() - INTERVAL '1 day'),
(9, 'alert', 'API Response Time Spike', 'Payment API response time increased 340% for 15 minutes', 'critical', 'resolved', NOW() - INTERVAL '6 hours'),
(7, 'threshold', 'CSAT Score Dropped Below 4.0', 'Customer satisfaction score dropped to 3.8 for third week consecutively', 'high', 'new', NOW() - INTERVAL '12 hours'),
(5, 'conversion', 'Landing Page Conversion Rate Up 28%', 'New hero section A/B test winner increased conversions significantly', 'info', 'processed', NOW() - INTERVAL '3 days'),
(6, 'payment_anomaly', 'Unusual Payment Refund Pattern', '14 refunds in 2 hours from same customer segment - possible billing bug', 'high', 'new', NOW() - INTERVAL '1 hour'),
(4, 'engagement', 'Engineering Channel Activity Down 45%', 'Slack message volume in #engineering dropped significantly this week', 'medium', 'new', NOW() - INTERVAL '2 days'),
(1, 'pipeline_change', 'Q4 Pipeline Coverage at 2.3x', 'Sales pipeline shows 2.3x coverage ratio for Q4 target', 'info', 'processed', NOW() - INTERVAL '5 hours'),
(8, 'campaign_result', 'Email Campaign Achieved 31% Open Rate', 'Product launch email campaign exceeded benchmarks significantly', 'info', 'processed', NOW() - INTERVAL '2 days'),
(13, 'hiring', 'Engineering Hiring Pipeline Stalled', '8 senior engineering roles open for 90+ days with no offers', 'high', 'new', NOW() - INTERVAL '3 days'),
(3, 'bug_count', 'Critical Bug Count Increased 200%', 'Critical bug reports tripled in last sprint, quality metrics degraded', 'critical', 'new', NOW() - INTERVAL '1 day'),
(6, 'mrr_milestone', 'MRR Crossed $3M Milestone', 'Monthly Recurring Revenue exceeded $3M for first time', 'info', 'processed', NOW() - INTERVAL '4 days'),
(9, 'outage', 'US-East-1 Region Partial Degradation', '20-minute partial service degradation affecting 8% of users', 'critical', 'resolved', NOW() - INTERVAL '1 week'),
(15, 'feature_adoption', 'New Dashboard Feature 62% Adoption in 2 Weeks', 'Newly launched analytics dashboard adopted by majority of active users', 'info', 'processed', NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

-- Insights
INSERT INTO insights (title, category, content, confidence_score, impact, action_required, assigned_to, status, tags) VALUES
('Revenue concentration risk in top 3 customers', 'financial', 'Top 3 customers represent 68% of ARR. If any churns, significant revenue impact. Recommend diversification strategy and customer success investment.', 92, 'critical', true, 'CEO', 'new', 'revenue,risk,churn'),
('Engineering velocity declining 3 weeks in row', 'operational', 'Sprint velocity dropped from 94% to 71% over 3 consecutive sprints. Root cause analysis suggests context switching from production incidents.', 87, 'high', true, 'CTO', 'in_review', 'engineering,velocity,sprints'),
('Marketing ROI strongest from content channel', 'marketing', 'Content marketing delivers 4.2x ROI vs paid ads at 1.8x. Recommend shifting 30% of paid budget to content production and SEO.', 89, 'medium', true, 'CMO', 'new', 'marketing,roi,content'),
('Customer support ticket volume increasing with product complexity', 'product', 'Support tickets increased 34% but product features grew 89%. Suggests onboarding and documentation gaps rather than product quality issues.', 85, 'medium', true, 'CPO', 'new', 'support,product,onboarding'),
('Slack usage patterns suggest remote team disengagement', 'people', 'After-hours Slack messages decreased 78% and response times increased 340% since remote policy change. Team cohesion metrics declining.', 78, 'high', true, 'VP People', 'new', 'slack,engagement,remote'),
('Stripe churn rate improving with new onboarding', 'financial', 'Monthly churn rate improved from 3.2% to 2.1% after onboarding redesign. Projected annual savings of $840K in retained revenue.', 94, 'high', false, 'Head of Growth', 'processed', 'churn,onboarding,revenue'),
('AWS costs growing faster than revenue', 'operational', 'Infrastructure costs growing at 2.3x revenue growth rate. Optimization opportunity of estimated $120K/month through reserved instances and rightsizing.', 91, 'high', true, 'DevOps Lead', 'new', 'aws,costs,optimization'),
('Sales cycle shortening for SMB segment', 'sales', 'Average SMB sales cycle reduced from 42 to 28 days after implementing self-serve trial. Deal velocity up 50%.', 88, 'medium', false, 'VP Sales', 'processed', 'sales,smb,velocity'),
('Product-qualified leads converting at 3.2x rate', 'marketing', 'Users who complete key activation events convert to paid at 3.2x rate vs direct demo requests. PQL strategy showing strong results.', 93, 'high', true, 'Head of Product', 'new', 'pql,conversion,activation'),
('Executive meeting effectiveness declining', 'operations', 'Calendar analysis shows 67% of executive meetings have no agenda and 43% result in no documented decisions. Meeting ROI very low.', 82, 'medium', true, 'COO', 'new', 'meetings,executives,productivity'),
('GitHub PR review times increasing', 'engineering', 'Average PR review time increased from 4h to 18h over 2 months. Blocking engineering throughput and increasing context switching costs.', 90, 'high', true, 'Engineering Manager', 'new', 'github,pr,reviews'),
('NPS score trending upward after redesign', 'product', 'Net Promoter Score improved from 34 to 61 over 3 months following product redesign. Highest score in company history.', 96, 'medium', false, 'CPO', 'processed', 'nps,product,redesign'),
('Seasonal revenue pattern requires cash flow planning', 'financial', 'Revenue patterns show 40% concentration in Q4. With current burn rate, recommend securing credit facility before Q3 to bridge Q1-Q2.', 88, 'critical', true, 'CFO', 'in_review', 'revenue,seasonality,cashflow'),
('Customer success team overwhelmed at current scale', 'operations', 'CSM-to-customer ratio at 1:142, well above 1:80 industry standard. Risk of churn increase unless team scales or automation deployed.', 87, 'high', true, 'VP Customer Success', 'new', 'csm,scale,automation'),
('LinkedIn job postings driving above-average candidate quality', 'hr', 'Candidates from LinkedIn have 2.1x higher offer acceptance rate and 1.8x better 90-day retention than other sources. Recommend increasing LinkedIn budget.', 83, 'medium', true, 'Head of Recruiting', 'new', 'recruiting,linkedin,quality')
ON CONFLICT DO NOTHING;

-- Anomalies
INSERT INTO anomalies (source_id, metric_name, expected_value, actual_value, deviation_pct, severity, description, status, detected_at) VALUES
(9, 'API P95 Response Time (ms)', 180, 820, 355.6, 'critical', 'Payment API response times spiked to 820ms vs normal 180ms baseline during peak hours', 'resolved', NOW() - INTERVAL '6 hours'),
(6, 'Daily Refund Rate (%)', 0.8, 4.2, 425, 'critical', 'Refund rate jumped from 0.8% to 4.2% - potential billing bug or fraud pattern', 'open', NOW() - INTERVAL '1 hour'),
(7, 'CSAT Score (1-5)', 4.3, 3.7, -14, 'high', 'Customer satisfaction score fell below 4.0 threshold for 3 consecutive weeks', 'open', NOW() - INTERVAL '12 hours'),
(5, 'Bounce Rate (%)', 42, 68, 61.9, 'high', 'Website bounce rate increased significantly on pricing page after recent update', 'open', NOW() - INTERVAL '2 days'),
(3, 'Critical Bug Open Count', 3, 11, 266.7, 'high', 'Critical bug count tripled in last 2-week sprint cycle, quality gates failing', 'open', NOW() - INTERVAL '1 day'),
(4, 'Daily Active Slack Users', 87, 61, -29.9, 'medium', 'Slack daily active users dropped below 70% of headcount for first time', 'open', NOW() - INTERVAL '3 days'),
(2, 'Average PR Review Time (hours)', 4, 18, 350, 'high', 'Pull request review times increased 4.5x over last 8 weeks', 'open', NOW() - INTERVAL '1 week'),
(1, 'Demo Show Rate (%)', 78, 54, -30.8, 'medium', 'Sales demo show rate dropped 25 percentage points this month', 'open', NOW() - INTERVAL '4 days'),
(8, 'Email Unsubscribe Rate (%)', 0.5, 1.8, 260, 'medium', 'Email unsubscribe rate spiked after last campaign batch send', 'investigating', NOW() - INTERVAL '2 days'),
(15, 'Feature X 30-Day Retention (%)', 65, 38, -41.5, 'high', 'New analytics dashboard has poor 30-day retention despite high initial adoption', 'open', NOW() - INTERVAL '5 days'),
(14, 'Monthly Burn Rate ($K)', 380, 512, 34.7, 'medium', 'Monthly burn rate increased 35% quarter over quarter without proportional revenue growth', 'investigating', NOW() - INTERVAL '1 week'),
(9, 'Error Rate (%)', 0.1, 0.8, 700, 'critical', 'Application error rate in checkout flow 7x above normal baseline', 'resolved', NOW() - INTERVAL '2 days'),
(13, 'Days to Fill Engineering Roles', 45, 112, 148.9, 'high', 'Senior engineering roles taking 2.5x longer to fill than target', 'open', NOW() - INTERVAL '3 weeks'),
(1, 'Average Deal Size ($K)', 85, 52, -38.8, 'medium', 'Average deal size declining as more deals close in SMB tier vs enterprise', 'monitoring', NOW() - INTERVAL '1 month'),
(6, 'MRR Expansion Rate (%)', 8, 3.2, -60, 'medium', 'Net MRR expansion from existing customers declined significantly this quarter', 'open', NOW() - INTERVAL '2 weeks')
ON CONFLICT DO NOTHING;

-- Saved Queries
INSERT INTO saved_queries (name, query_text, query_type, result_summary, tags, is_scheduled, schedule_frequency, run_count) VALUES
('Weekly Revenue Summary', 'What is our current MRR, growth rate, and top 5 revenue drivers this week?', 'natural_language', 'MRR: $3.2M, growth 8.2% MoM, top drivers: Enterprise expansion and new SMB logos', 'revenue,weekly', true, 'weekly', 47),
('Engineering Velocity Check', 'How is engineering velocity trending over the last 3 sprints and what are the blockers?', 'natural_language', 'Velocity declined 23% over 3 sprints due to incident response overhead', 'engineering,velocity', true, 'weekly', 32),
('Customer Health Dashboard', 'Which customers have declining usage patterns and are at churn risk?', 'natural_language', '14 accounts show declining DAU and low NPS. 6 are enterprise tier at risk.', 'customers,churn,health', true, 'daily', 89),
('Marketing Channel ROI', 'What is the ROI for each marketing channel and where should we increase investment?', 'natural_language', 'Content: 4.2x, SEO: 3.8x, Paid: 1.8x, Events: 2.1x. Shift budget to content.', 'marketing,roi,channels', false, NULL, 23),
('Support Ticket Trends', 'What support issues are most common this week and what product changes would eliminate them?', 'natural_language', 'Top issues: onboarding confusion (34%), billing questions (22%), API docs (18%)', 'support,product,tickets', true, 'weekly', 56),
('Anomaly Summary', 'Summarize all open anomalies and their business impact ranked by severity', 'natural_language', '3 critical, 6 high, 4 medium anomalies open. Estimated revenue impact $280K if unresolved.', 'anomalies,severity,impact', true, 'daily', 104),
('Hiring Pipeline Status', 'What is the current status of all open roles and projected time to fill?', 'natural_language', '23 open roles, 8 critical engineering. Average time to fill at 89 days vs 45 target.', 'hiring,recruiting,pipeline', false, NULL, 15),
('Infrastructure Cost Optimization', 'Which AWS services are over-provisioned and what are the top cost reduction opportunities?', 'natural_language', 'RDS 60% over-provisioned, EC2 reserved instance savings of $85K/year available', 'aws,costs,optimization', false, NULL, 28),
('Competitive Win/Loss Analysis', 'What are the top reasons we win or lose deals vs competitors this quarter?', 'natural_language', 'Win: Ease of use (42%), pricing (28%). Loss: Missing enterprise features (38%), price (22%)', 'sales,competitive,deals', false, NULL, 19),
('Team Productivity Pulse', 'How productive is each team based on output metrics and meeting load?', 'natural_language', 'Engineering most productive. Sales and CS teams have highest meeting loads (62% of work hours)', 'teams,productivity,meetings', true, 'weekly', 38),
('Product Adoption Funnel', 'What is the drop-off in the product activation funnel and where do new users get stuck?', 'natural_language', 'Biggest drop at integration setup step (67% abandon). Second biggest at first report creation (43%)', 'product,activation,funnel', false, NULL, 41),
('Financial Health Check', 'What is our current burn rate, runway, and unit economics?', 'natural_language', 'Burn: $512K/mo, Runway: 18 months, CAC: $3,200, LTV: $24,000, LTV/CAC: 7.5x', 'finance,burn,runway', true, 'monthly', 12),
('Sales Pipeline Forecast', 'What is the Q4 sales forecast and pipeline quality assessment?', 'natural_language', 'Q4 forecast: $4.2M, pipeline coverage 2.3x. 68% confidence in hitting number.', 'sales,forecast,pipeline', true, 'weekly', 63),
('New Feature Impact', 'What business impact has the new analytics dashboard had on activation and retention?', 'natural_language', 'Activation rate up 18%, but 30-day retention only 38%. Feature needs improvement.', 'product,features,impact', false, NULL, 9),
('Executive Briefing Pack', 'Generate a concise CEO briefing with top wins, risks, and decisions needed this week', 'natural_language', 'Wins: MRR milestone, NPS high. Risks: engineering quality, CSAT drop. Decisions: hiring investment', 'executive,briefing,weekly', true, 'weekly', 72)
ON CONFLICT DO NOTHING;

-- Health Scores
INSERT INTO health_scores (department, overall_score, productivity_score, velocity_score, quality_score, collaboration_score, trend, notes, period) VALUES
('Engineering', 72, 68, 71, 61, 88, 'declining', 'Velocity and quality declining due to incident load. Collaboration strong.', 'Q4-2025-W1'),
('Sales', 85, 88, 82, 79, 91, 'improving', 'Strong quarter with MRR milestone hit. Pipeline healthy.', 'Q4-2025-W1'),
('Marketing', 78, 81, 76, 83, 72, 'stable', 'Content ROI strong, paid underperforming. Email list growing well.', 'Q4-2025-W1'),
('Customer Success', 69, 72, 64, 71, 80, 'declining', 'CSM ratio too high. At-risk accounts increasing. CSAT dropping.', 'Q4-2025-W1'),
('Product', 80, 78, 83, 77, 84, 'improving', 'NPS all-time high. Feature adoption strong. Roadmap well-defined.', 'Q4-2025-W1'),
('DevOps', 74, 79, 71, 72, 76, 'stable', 'Infra reliable but costs escalating. Deployment frequency good.', 'Q4-2025-W1'),
('HR', 65, 67, 58, 71, 74, 'declining', 'Hiring velocity too slow. Retention good but time-to-fill too high.', 'Q4-2025-W1'),
('Finance', 83, 86, 80, 88, 79, 'stable', 'Financials well-managed. Burn tracking. Runway comfortable.', 'Q4-2025-W1'),
('Engineering', 76, 74, 78, 71, 85, 'stable', 'Previous period comparison shows modest improvement.', 'Q3-2025-W4'),
('Sales', 79, 82, 76, 75, 88, 'improving', 'Pipeline building strongly toward Q4.', 'Q3-2025-W4'),
('Marketing', 75, 79, 73, 78, 70, 'stable', 'Campaign results mixed. Working on channel diversification.', 'Q3-2025-W4'),
('Customer Success', 73, 76, 70, 76, 82, 'stable', 'CSM load manageable last period. Churn better.', 'Q3-2025-W4'),
('Product', 74, 73, 77, 72, 79, 'improving', 'Post-redesign momentum building. NPS rising.', 'Q3-2025-W4'),
('DevOps', 71, 77, 68, 69, 74, 'stable', 'Infrastructure work ongoing. Reliability improving.', 'Q3-2025-W4'),
('HR', 70, 71, 65, 73, 76, 'stable', 'Hiring picking up. Culture scores solid.', 'Q3-2025-W4')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Deep-feature seed data (audit pass 2026-05-14)
-- ============================================================================

-- Departments (8 rows)
INSERT INTO departments (slug, name, head_email, headcount, charter, cost_center, primary_kpis, upstream_deps, downstream_deps) VALUES
('sales', 'Sales', 'vp.sales@companyos.ai', 42, 'New logo + expansion ARR', 'CC-100', 'arr,new_logos,cac,win_rate', 'marketing,product', 'finance,cs'),
('marketing', 'Marketing', 'cmo@companyos.ai', 18, 'Pipeline generation, brand', 'CC-110', 'mqls,pipeline_coverage,cac', 'product', 'sales'),
('finance', 'Finance', 'cfo@companyos.ai', 9, 'Capital allocation, reporting, AR/AP', 'CC-200', 'burn_multiple,gross_margin,runway_months', 'sales,ops', 'sales,engineering,hr'),
('engineering', 'Engineering', 'cto@companyos.ai', 95, 'Build, ship, operate the product', 'CC-300', 'deployment_frequency,mttr,velocity', 'product', 'product,ops'),
('product', 'Product', 'cpo@companyos.ai', 14, 'Roadmap, discovery, PMM', 'CC-310', 'nps,activation_rate,feature_adoption', 'cs', 'engineering,marketing'),
('cs', 'Customer Success', 'cs.lead@companyos.ai', 22, 'Retention, expansion, CSAT', 'CC-400', 'nrr,gross_retention,csat', 'sales', 'product,sales'),
('support', 'Support', 'support.lead@companyos.ai', 17, 'Ticket resolution, deflection', 'CC-410', 'csat,first_response_min,resolution_hours', 'product,engineering', 'cs,product'),
('hr', 'People & Talent', 'chro@companyos.ai', 8, 'Hiring, comp, culture', 'CC-500', 'time_to_fill,regrettable_attrition_pct', 'finance', 'all')
ON CONFLICT (slug) DO NOTHING;

-- Connectors (12 rows) — real SaaS sources
INSERT INTO connectors (vendor, display_name, category, auth_type, api_base_url, oauth_scopes, status, health, last_sync_at, next_sync_at, records_synced, records_failed, rate_limit_per_min, cost_per_month_cents, owner_department, config) VALUES
('salesforce', 'Salesforce (NA prod org)', 'crm', 'oauth2', 'https://acme.my.salesforce.com', 'api,refresh_token,offline_access', 'connected', 'green', NOW() - INTERVAL '3 minutes', NOW() + INTERVAL '57 minutes', 1542030, 142, 100, 15000, 'sales', '{"objects":["Account","Opportunity","Contact","Lead"],"bulk_api":true}'),
('hubspot', 'HubSpot Marketing Hub', 'crm', 'oauth2', 'https://api.hubapi.com', 'contacts,oauth,content', 'connected', 'green', NOW() - INTERVAL '6 minutes', NOW() + INTERVAL '54 minutes', 893010, 12, 110, 8000, 'marketing', '{"portal_id":24681035,"sync_lists":true}'),
('netsuite', 'NetSuite ERP', 'erp', 'oauth2', 'https://1234567.suitetalk.api.netsuite.com', 'rest_webservices', 'connected', 'yellow', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '1 hour', 234500, 412, 30, 32000, 'finance', '{"subsidiary":"USA","saved_searches":["AR_Aging","Sales_By_Customer"]}'),
('quickbooks', 'QuickBooks Online', 'accounting', 'oauth2', 'https://quickbooks.api.intuit.com', 'com.intuit.quickbooks.accounting', 'connected', 'green', NOW() - INTERVAL '12 minutes', NOW() + INTERVAL '48 minutes', 34567, 3, 500, 6000, 'finance', '{"realm_id":"9341452198765"}'),
('slack', 'Slack (Acme workspace)', 'communication', 'oauth2', 'https://slack.com/api', 'channels:history,users:read,im:read', 'connected', 'green', NOW() - INTERVAL '40 seconds', NOW() + INTERVAL '1 minute', 1567800, 0, 60, 0, 'ops', '{"workspace":"T08K2H...","channels_synced":143}'),
('gmail', 'Gmail (sales@ shared)', 'email', 'oauth2', 'https://gmail.googleapis.com', 'https://www.googleapis.com/auth/gmail.readonly', 'connected', 'green', NOW() - INTERVAL '2 minutes', NOW() + INTERVAL '8 minutes', 412390, 8, 250, 0, 'sales', '{"mailbox":"sales@acme.com","labels":["INBOX","Sent"]}'),
('github', 'GitHub (acme org)', 'version_control', 'oauth2', 'https://api.github.com', 'repo,read:org,read:user', 'connected', 'green', NOW() - INTERVAL '1 minute', NOW() + INTERVAL '4 minutes', 893021, 1, 5000, 0, 'engineering', '{"org":"acme","repos":"all"}'),
('linear', 'Linear (Engineering)', 'issue_tracking', 'oauth2', 'https://api.linear.app', 'read,write', 'connected', 'green', NOW() - INTERVAL '50 seconds', NOW() + INTERVAL '4 minutes', 22150, 0, 1500, 0, 'engineering', '{"teams":["ENG","INFRA"]}'),
('stripe', 'Stripe (live)', 'payments', 'api_key', 'https://api.stripe.com', '', 'connected', 'green', NOW() - INTERVAL '20 seconds', NOW() + INTERVAL '1 minute', 34567, 0, 1000, 0, 'finance', '{"account":"acct_1N4..."}'),
('zendesk', 'Zendesk Support', 'support', 'oauth2', 'https://acme.zendesk.com/api/v2', 'tickets:read,users:read', 'error', 'red', NOW() - INTERVAL '14 hours', NOW() + INTERVAL '5 minutes', 18920, 412, 200, 4900, 'support', '{"subdomain":"acme","error":"401 token expired"}'),
('intercom', 'Intercom Messenger', 'support', 'oauth2', 'https://api.intercom.io', 'read,write', 'connected', 'green', NOW() - INTERVAL '3 minutes', NOW() + INTERVAL '17 minutes', 56780, 2, 1000, 7400, 'support', '{"workspace":"...intercom..."}'),
('greenhouse', 'Greenhouse ATS', 'hr', 'api_key', 'https://harvest.greenhouse.io/v1', '', 'paused', 'yellow', NOW() - INTERVAL '3 days', NULL, 2340, 0, 200, 1500, 'hr', '{"paused_reason":"renewal under review"}')
ON CONFLICT DO NOTHING;

-- Agent tools (12 rows) - MCP-style function-calling catalog
INSERT INTO agent_tools (slug, name, connector_vendor, description, input_schema, output_schema, side_effect, approval_required, call_count, error_rate_pct) VALUES
('sfdc.query_opportunity', 'Salesforce: Query Opportunity', 'salesforce', 'Fetch opportunity by id or filter', '{"type":"object","properties":{"id":{"type":"string"},"filter":{"type":"string"}}}', '{"type":"object"}', 'read', false, 18432, 0.4),
('sfdc.update_stage', 'Salesforce: Update Opp Stage', 'salesforce', 'Move an opportunity to a new stage', '{"type":"object","properties":{"opp_id":{"type":"string"},"stage":{"type":"string"}},"required":["opp_id","stage"]}', '{"type":"object"}', 'write', true, 943, 1.2),
('hubspot.search_contacts', 'HubSpot: Search Contacts', 'hubspot', 'Search HubSpot contacts by query', '{"type":"object","properties":{"q":{"type":"string"}}}', '{"type":"array"}', 'read', false, 9128, 0.1),
('quickbooks.create_invoice', 'QuickBooks: Create Invoice', 'quickbooks', 'Create AR invoice in QuickBooks', '{"type":"object","properties":{"customer_id":{"type":"string"},"amount_usd":{"type":"number"},"line_items":{"type":"array"}}}', '{"type":"object"}', 'irreversible', true, 287, 0.7),
('netsuite.lookup_customer', 'NetSuite: Lookup Customer', 'netsuite', 'Find a customer by external id or email', '{"type":"object","properties":{"email":{"type":"string"}}}', '{"type":"object"}', 'read', false, 4012, 2.3),
('slack.post_message', 'Slack: Post Message', 'slack', 'Post a message to a channel or user', '{"type":"object","properties":{"channel":{"type":"string"},"text":{"type":"string"}}}', '{"type":"object"}', 'write', false, 31402, 0.05),
('gmail.draft_reply', 'Gmail: Draft Reply', 'gmail', 'Create a draft reply on a thread', '{"type":"object","properties":{"thread_id":{"type":"string"},"body":{"type":"string"}}}', '{"type":"object"}', 'write', true, 2102, 0.3),
('linear.create_issue', 'Linear: Create Issue', 'linear', 'Open a Linear ticket', '{"type":"object","properties":{"team":{"type":"string"},"title":{"type":"string"},"description":{"type":"string"}}}', '{"type":"object"}', 'write', false, 1543, 0.2),
('github.open_pr', 'GitHub: Open Pull Request', 'github', 'Open a PR from a branch', '{"type":"object","properties":{"repo":{"type":"string"},"head":{"type":"string"},"base":{"type":"string"},"title":{"type":"string"}}}', '{"type":"object"}', 'write', true, 412, 0.8),
('stripe.refund', 'Stripe: Issue Refund', 'stripe', 'Refund a charge', '{"type":"object","properties":{"charge_id":{"type":"string"},"amount_cents":{"type":"integer"}}}', '{"type":"object"}', 'irreversible', true, 87, 1.1),
('intercom.tag_user', 'Intercom: Tag User', 'intercom', 'Tag a user for a campaign', '{"type":"object","properties":{"user_id":{"type":"string"},"tag":{"type":"string"}}}', '{"type":"object"}', 'write', false, 5621, 0.1),
('zendesk.create_ticket', 'Zendesk: Create Ticket', 'zendesk', 'Open a support ticket', '{"type":"object","properties":{"subject":{"type":"string"},"body":{"type":"string"},"requester_email":{"type":"string"}}}', '{"type":"object"}', 'write', false, 873, 3.4)
ON CONFLICT (slug) DO NOTHING;

-- Agents (8 rows)
INSERT INTO agents (slug, name, role, department, model, tool_slugs, system_prompt, cost_per_1k_tokens_cents, success_rate_pct, avg_latency_ms) VALUES
('planner', 'Planner Agent', 'planner', 'all', 'anthropic/claude-haiku-4.5', 'sfdc.query_opportunity,hubspot.search_contacts,netsuite.lookup_customer', 'You are the planner agent. Decompose company-level goals into ordered steps and route them to executor agents.', 0.25, 94.2, 2400),
('sales-exec', 'Sales Executor', 'executor', 'sales', 'anthropic/claude-haiku-4.5', 'sfdc.query_opportunity,sfdc.update_stage,hubspot.search_contacts,gmail.draft_reply', 'Execute sales-pipeline actions: progress opps, draft outbound emails, sync CRM state. Always require human approval for stage changes >$50k ACV.', 0.25, 91.8, 3100),
('finance-exec', 'Finance Executor', 'executor', 'finance', 'anthropic/claude-haiku-4.5', 'quickbooks.create_invoice,netsuite.lookup_customer,stripe.refund', 'Handle AR cycles: invoice creation, refund processing, AR aging. All irreversible actions require approval.', 0.25, 96.5, 2800),
('cs-exec', 'CS Executor', 'executor', 'cs', 'anthropic/claude-haiku-4.5', 'intercom.tag_user,zendesk.create_ticket,slack.post_message', 'Customer success operations: churn signals, health scoring, escalations.', 0.25, 93.0, 2200),
('eng-exec', 'Engineering Executor', 'executor', 'engineering', 'anthropic/claude-haiku-4.5', 'linear.create_issue,github.open_pr,slack.post_message', 'Engineering operations: convert specs to Linear issues, open scaffolded PRs, broadcast deploys.', 0.25, 89.7, 4100),
('evaluator', 'Decision Evaluator', 'evaluator', 'all', 'anthropic/claude-haiku-4.5', '', 'Audit agent decisions for guardrail violations. Flag anything irreversible without approval.', 0.20, 99.1, 1500),
('router', 'Inbox Router', 'router', 'support', 'anthropic/claude-haiku-4.5', 'zendesk.create_ticket,intercom.tag_user', 'Route inbound emails/messages to correct queue based on intent classification.', 0.10, 97.4, 900),
('analyst', 'KPI Analyst', 'evaluator', 'finance', 'anthropic/claude-haiku-4.5', 'netsuite.lookup_customer', 'Compute KPIs (CAC, LTV, NRR, burn multiple). Flag deviations from targets.', 0.30, 95.5, 3500)
ON CONFLICT (slug) DO NOTHING;

-- KPIs (14 rows) — real SaaS/finance definitions
INSERT INTO kpis (slug, name, department, unit, formula, source_connectors, target_value, good_direction, cadence, description) VALUES
('arr', 'Annual Recurring Revenue', 'sales', 'usd', 'sum(active_subscription.mrr) * 12', 'stripe,salesforce', 60000000, 'up', 'monthly', 'Top-line recurring revenue annualized.'),
('cac', 'Customer Acquisition Cost', 'marketing', 'usd', '(sales_and_marketing_spend) / new_customers', 'quickbooks,hubspot,salesforce', 8500, 'down', 'quarterly', 'Blended S&M spend divided by net new logos.'),
('ltv', 'Customer Lifetime Value', 'cs', 'usd', 'ARPA * gross_margin / monthly_churn', 'stripe,netsuite', 142000, 'up', 'quarterly', 'Expected gross margin per customer over lifetime.'),
('ltv_cac', 'LTV / CAC Ratio', 'finance', 'ratio', 'LTV / CAC', '', 4.0, 'up', 'quarterly', 'Capital efficiency of new-logo acquisition.'),
('nrr', 'Net Revenue Retention', 'cs', 'pct', '(starting_arr + expansion - churn - contraction) / starting_arr', 'stripe,salesforce', 120, 'up', 'monthly', 'Includes expansion. >120% indicates strong land-and-expand.'),
('gross_retention', 'Gross Revenue Retention', 'cs', 'pct', '(starting_arr - churn - contraction) / starting_arr', 'stripe', 92, 'up', 'monthly', 'Retention without expansion.'),
('burn_multiple', 'Burn Multiple', 'finance', 'ratio', 'net_burn / net_new_arr', 'quickbooks,stripe', 1.0, 'down', 'quarterly', 'Bessemer metric. <1 great, 1-1.5 ok, >2 bad.'),
('runway_months', 'Cash Runway', 'finance', 'months', 'cash / monthly_net_burn', 'quickbooks,netsuite', 24, 'up', 'monthly', 'Months of runway at current burn.'),
('gross_margin', 'Gross Margin', 'finance', 'pct', '(revenue - cogs) / revenue', 'netsuite,quickbooks', 78, 'up', 'quarterly', 'Pure SaaS GM target ~80%.'),
('pipeline_coverage', 'Pipeline Coverage', 'sales', 'ratio', 'open_pipeline_amount / period_quota', 'salesforce', 3.0, 'up', 'monthly', 'How many times over coverage of remaining quota.'),
('win_rate', 'Win Rate', 'sales', 'pct', 'won_opps / (won_opps + lost_opps)', 'salesforce', 28, 'up', 'monthly', 'Closed-won % of closed opps.'),
('mttr', 'Mean Time To Recovery', 'engineering', 'hours', 'avg(resolved_at - incident_start)', 'linear,github', 4.0, 'down', 'monthly', 'How fast incidents are recovered.'),
('csat', 'Customer Satisfaction', 'support', 'pct', 'positive_csat / total_csat', 'zendesk,intercom', 92, 'up', 'monthly', 'CSAT across support touchpoints.'),
('time_to_fill', 'Time-to-Fill', 'hr', 'days', 'avg(filled_at - opened_at)', 'greenhouse', 45, 'down', 'monthly', 'Average open-to-offer-accept days.')
ON CONFLICT (slug) DO NOTHING;

-- KPI snapshots (32 rows) — last 4 periods for top KPIs
INSERT INTO kpi_snapshots (kpi_id, period, value, prev_value, delta_pct, status, notes) VALUES
((SELECT id FROM kpis WHERE slug='arr'), '2026-04', 51200000, 49800000, 2.81, 'green', 'Net-new $1.4M; expansion $0.6M; logo churn $0.2M.'),
((SELECT id FROM kpis WHERE slug='arr'), '2026-03', 49800000, 47900000, 3.97, 'green', 'Largest expansion month of FY.'),
((SELECT id FROM kpis WHERE slug='arr'), '2026-02', 47900000, 46350000, 3.34, 'green', NULL),
((SELECT id FROM kpis WHERE slug='arr'), '2026-01', 46350000, 45100000, 2.77, 'green', NULL),
((SELECT id FROM kpis WHERE slug='cac'), '2026-Q1', 9800, 9400, 4.25, 'yellow', 'Above $8.5k target. Paid channel CAC inflating blended.'),
((SELECT id FROM kpis WHERE slug='cac'), '2025-Q4', 9400, 9100, 3.30, 'yellow', NULL),
((SELECT id FROM kpis WHERE slug='cac'), '2025-Q3', 9100, 8800, 3.41, 'yellow', NULL),
((SELECT id FROM kpis WHERE slug='ltv'), '2026-Q1', 138000, 135000, 2.22, 'green', NULL),
((SELECT id FROM kpis WHERE slug='ltv'), '2025-Q4', 135000, 131000, 3.05, 'green', NULL),
((SELECT id FROM kpis WHERE slug='ltv_cac'), '2026-Q1', 14.08, 14.36, -1.95, 'green', 'Well above 4.0x target.'),
((SELECT id FROM kpis WHERE slug='ltv_cac'), '2025-Q4', 14.36, 14.40, -0.28, 'green', NULL),
((SELECT id FROM kpis WHERE slug='nrr'), '2026-04', 121, 118, 2.54, 'green', 'Just above 120 target.'),
((SELECT id FROM kpis WHERE slug='nrr'), '2026-03', 118, 116, 1.72, 'yellow', NULL),
((SELECT id FROM kpis WHERE slug='nrr'), '2026-02', 116, 115, 0.87, 'yellow', NULL),
((SELECT id FROM kpis WHERE slug='nrr'), '2026-01', 115, 113, 1.77, 'yellow', NULL),
((SELECT id FROM kpis WHERE slug='gross_retention'), '2026-04', 93, 92, 1.09, 'green', NULL),
((SELECT id FROM kpis WHERE slug='gross_retention'), '2026-03', 92, 91, 1.10, 'green', NULL),
((SELECT id FROM kpis WHERE slug='burn_multiple'), '2026-Q1', 1.4, 1.6, -12.50, 'yellow', 'Improving. Goal <1.0.'),
((SELECT id FROM kpis WHERE slug='burn_multiple'), '2025-Q4', 1.6, 1.9, -15.79, 'yellow', NULL),
((SELECT id FROM kpis WHERE slug='runway_months'), '2026-04', 26, 25, 4.00, 'green', NULL),
((SELECT id FROM kpis WHERE slug='runway_months'), '2026-03', 25, 24, 4.17, 'green', NULL),
((SELECT id FROM kpis WHERE slug='gross_margin'), '2026-Q1', 76.4, 75.8, 0.79, 'yellow', 'Just below 78% target.'),
((SELECT id FROM kpis WHERE slug='gross_margin'), '2025-Q4', 75.8, 74.9, 1.20, 'yellow', NULL),
((SELECT id FROM kpis WHERE slug='pipeline_coverage'), '2026-04', 3.2, 2.9, 10.34, 'green', NULL),
((SELECT id FROM kpis WHERE slug='pipeline_coverage'), '2026-03', 2.9, 2.7, 7.41, 'yellow', NULL),
((SELECT id FROM kpis WHERE slug='win_rate'), '2026-04', 29, 27, 7.41, 'green', NULL),
((SELECT id FROM kpis WHERE slug='win_rate'), '2026-03', 27, 26, 3.85, 'yellow', NULL),
((SELECT id FROM kpis WHERE slug='mttr'), '2026-04', 3.6, 4.2, -14.29, 'green', 'On-call rotation revamp paying off.'),
((SELECT id FROM kpis WHERE slug='mttr'), '2026-03', 4.2, 5.1, -17.65, 'yellow', NULL),
((SELECT id FROM kpis WHERE slug='csat'), '2026-04', 91, 89, 2.25, 'yellow', 'Just below 92% target.'),
((SELECT id FROM kpis WHERE slug='csat'), '2026-03', 89, 88, 1.14, 'yellow', NULL),
((SELECT id FROM kpis WHERE slug='time_to_fill'), '2026-04', 52, 58, -10.34, 'yellow', 'Senior eng roles dragging average.')
ON CONFLICT DO NOTHING;

-- Workflows (6 rows) - canonical cross-functional processes
INSERT INTO workflows (slug, name, description, trigger_type, departments, step_definition, sla_hours, active) VALUES
('lead-to-cash', 'Lead → Quote → Contract → Invoice → Cash', 'End-to-end revenue workflow from inbound lead to collected cash.', 'event', 'marketing,sales,finance', '[{"name":"qualify","owner":"hubspot","agent":"router"},{"name":"create_opp","owner":"salesforce","agent":"sales-exec"},{"name":"generate_quote","owner":"salesforce","agent":"sales-exec"},{"name":"contract_sign","owner":"docusign","agent":"sales-exec","approval":true},{"name":"create_invoice","owner":"quickbooks","agent":"finance-exec","approval":true},{"name":"collect","owner":"stripe","agent":"finance-exec"}]', 720, true),
('incident-to-postmortem', 'Incident → Recover → Postmortem', 'Production incident lifecycle through Linear/GitHub/Slack.', 'event', 'engineering,support', '[{"name":"detect","owner":"cloudwatch"},{"name":"page","owner":"slack","agent":"eng-exec"},{"name":"recover","owner":"github","agent":"eng-exec"},{"name":"postmortem","owner":"linear","agent":"eng-exec"}]', 24, true),
('churn-save', 'Churn Signal → Save Play', 'CS-led churn save when product engagement drops below threshold.', 'agent', 'cs,product,sales', '[{"name":"detect","owner":"mixpanel","agent":"cs-exec"},{"name":"reach_out","owner":"intercom","agent":"cs-exec"},{"name":"discount_approval","owner":"finance","agent":"finance-exec","approval":true},{"name":"renewal","owner":"salesforce","agent":"sales-exec"}]', 168, true),
('hire-loop', 'Hire Loop', 'Open → Source → Phone Screen → Onsite → Offer.', 'manual', 'hr', '[{"name":"open","owner":"greenhouse"},{"name":"source"},{"name":"phone_screen"},{"name":"onsite"},{"name":"offer","approval":true}]', 720, true),
('monthly-close', 'Monthly Close', 'Finance close cycle: revenue rec, AR aging, board pack.', 'cron', 'finance', '[{"name":"recognize_revenue","owner":"netsuite","agent":"finance-exec"},{"name":"ar_aging","owner":"netsuite","agent":"analyst"},{"name":"board_pack","owner":"slides","agent":"analyst"}]', 120, true),
('weekly-exec-brief', 'Weekly Executive Brief', 'Cross-department brief from KPIs + anomalies + decisions.', 'cron', 'all', '[{"name":"pull_kpis"},{"name":"cluster_anomalies","agent":"analyst"},{"name":"draft_brief","agent":"planner"},{"name":"post","owner":"slack","agent":"planner"}]', 4, true)
ON CONFLICT (slug) DO NOTHING;

-- Workflow runs (10 rows)
INSERT INTO workflow_runs (workflow_id, external_ref, subject, current_step, status, amount_usd, started_at, finished_at, sla_breached, context) VALUES
((SELECT id FROM workflows WHERE slug='lead-to-cash'), 'SFDC-OPP-00874', 'Acme Corp — 250-seat renewal', 'create_invoice', 'running', 480000, NOW() - INTERVAL '4 days', NULL, false, '{"close_date":"2026-05-30","mrr_uplift":40000}'),
((SELECT id FROM workflows WHERE slug='lead-to-cash'), 'SFDC-OPP-00875', 'Globex — new logo, mid-market', 'generate_quote', 'running', 96000, NOW() - INTERVAL '2 days', NULL, false, '{"product_pkg":"team-plus","seats":120}'),
((SELECT id FROM workflows WHERE slug='lead-to-cash'), 'SFDC-OPP-00867', 'Initech — Q1 deal', 'collect', 'succeeded', 230000, NOW() - INTERVAL '21 days', NOW() - INTERVAL '7 days', false, '{"net_terms":30}'),
((SELECT id FROM workflows WHERE slug='lead-to-cash'), 'SFDC-OPP-00859', 'Stark Industries — expansion', 'contract_sign', 'blocked', 1200000, NOW() - INTERVAL '14 days', NULL, true, '{"blocker":"legal_review","redlines":7}'),
((SELECT id FROM workflows WHERE slug='incident-to-postmortem'), 'INC-2026-0418', 'us-east-1 payment outage', 'postmortem', 'succeeded', NULL, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '2 hours', false, '{"severity":"S1","customers_impacted":340}'),
((SELECT id FROM workflows WHERE slug='churn-save'), 'CS-SAVE-432', 'Wayne Enterprises — engagement dropping', 'reach_out', 'running', 240000, NOW() - INTERVAL '3 days', NULL, false, '{"health_score":42,"sentiment":"negative"}'),
((SELECT id FROM workflows WHERE slug='churn-save'), 'CS-SAVE-431', 'Soylent Corp — usage flatline', 'discount_approval', 'blocked', 84000, NOW() - INTERVAL '5 days', NULL, true, '{"discount_pct":25,"approver":"cfo"}'),
((SELECT id FROM workflows WHERE slug='hire-loop'), 'GH-REQ-883', 'Staff Engineer, Platform', 'phone_screen', 'running', NULL, NOW() - INTERVAL '30 days', NULL, false, '{"candidates_active":6}'),
((SELECT id FROM workflows WHERE slug='monthly-close'), 'CLOSE-2026-04', 'April close', 'board_pack', 'running', NULL, NOW() - INTERVAL '3 days', NULL, false, '{"days_to_close":4}'),
((SELECT id FROM workflows WHERE slug='weekly-exec-brief'), 'WB-2026-W19', 'Week 19 exec brief', 'post', 'succeeded', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', false, '{"recipients":12}')
ON CONFLICT DO NOTHING;

-- Workflow steps (16 rows)
INSERT INTO workflow_steps (run_id, step_name, step_order, status, agent, input, output, started_at, finished_at, duration_ms) VALUES
((SELECT id FROM workflow_runs WHERE external_ref='SFDC-OPP-00874'), 'qualify', 1, 'ok', 'router', '{"lead_source":"webinar"}', '{"icp_fit":92}', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days' + INTERVAL '12 minutes', 720000),
((SELECT id FROM workflow_runs WHERE external_ref='SFDC-OPP-00874'), 'create_opp', 2, 'ok', 'sales-exec', '{}', '{"opp_id":"006Bx..."}', NOW() - INTERVAL '4 days' + INTERVAL '15 minutes', NOW() - INTERVAL '4 days' + INTERVAL '18 minutes', 180000),
((SELECT id FROM workflow_runs WHERE external_ref='SFDC-OPP-00874'), 'generate_quote', 3, 'ok', 'sales-exec', '{"pkg":"enterprise","seats":250}', '{"acv":480000}', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '1 hour', 3600000),
((SELECT id FROM workflow_runs WHERE external_ref='SFDC-OPP-00874'), 'contract_sign', 4, 'ok', 'sales-exec', '{}', '{"signed_at":"2026-05-10"}', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', 86400000),
((SELECT id FROM workflow_runs WHERE external_ref='SFDC-OPP-00874'), 'create_invoice', 5, 'running', 'finance-exec', '{"amount":480000,"net":30}', NULL, NOW() - INTERVAL '4 hours', NULL, NULL),
((SELECT id FROM workflow_runs WHERE external_ref='SFDC-OPP-00859'), 'contract_sign', 4, 'failed', 'sales-exec', '{}', '{"reason":"legal redlines"}', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '6 hours', 21600000),
((SELECT id FROM workflow_runs WHERE external_ref='INC-2026-0418'), 'detect', 1, 'ok', NULL, '{"alert":"5xx>1%"}', '{}', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours' + INTERVAL '30 seconds', 30000),
((SELECT id FROM workflow_runs WHERE external_ref='INC-2026-0418'), 'page', 2, 'ok', 'eng-exec', '{"channel":"#oncall"}', '{}', NOW() - INTERVAL '5 hours 59 minutes', NOW() - INTERVAL '5 hours 59 minutes' + INTERVAL '5 seconds', 5000),
((SELECT id FROM workflow_runs WHERE external_ref='INC-2026-0418'), 'recover', 3, 'ok', 'eng-exec', '{"rollback":true}', '{"mttr_min":54}', NOW() - INTERVAL '5 hours 58 minutes', NOW() - INTERVAL '5 hours 4 minutes', 3240000),
((SELECT id FROM workflow_runs WHERE external_ref='INC-2026-0418'), 'postmortem', 4, 'ok', 'eng-exec', '{}', '{"linear_id":"INFRA-1842"}', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '2 hours', 10800000),
((SELECT id FROM workflow_runs WHERE external_ref='CS-SAVE-432'), 'detect', 1, 'ok', 'cs-exec', '{"score":42}', '{}', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '1 minute', 60000),
((SELECT id FROM workflow_runs WHERE external_ref='CS-SAVE-432'), 'reach_out', 2, 'running', 'cs-exec', '{"channel":"intercom"}', NULL, NOW() - INTERVAL '2 days', NULL, NULL),
((SELECT id FROM workflow_runs WHERE external_ref='CS-SAVE-431'), 'discount_approval', 3, 'pending', 'finance-exec', '{"discount":25}', NULL, NOW() - INTERVAL '4 days', NULL, NULL),
((SELECT id FROM workflow_runs WHERE external_ref='CLOSE-2026-04'), 'recognize_revenue', 1, 'ok', 'finance-exec', '{}', '{"recognized":4280000}', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '2 hours', 7200000),
((SELECT id FROM workflow_runs WHERE external_ref='CLOSE-2026-04'), 'ar_aging', 2, 'ok', 'analyst', '{}', '{"30d":840000,"60d":120000,"90d":40000}', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '1 hour', 3600000),
((SELECT id FROM workflow_runs WHERE external_ref='CLOSE-2026-04'), 'board_pack', 3, 'running', 'analyst', '{}', NULL, NOW() - INTERVAL '1 day', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Agent runs (10 rows)
INSERT INTO agent_runs (agent_id, workflow_run_id, goal, plan, status, steps_planned, steps_completed, tokens_in, tokens_out, cost_cents, started_at, finished_at, outcome) VALUES
((SELECT id FROM agents WHERE slug='planner'), (SELECT id FROM workflow_runs WHERE external_ref='SFDC-OPP-00874'), 'Progress Acme renewal from contract to cash', '[{"tool":"sfdc.query_opportunity"},{"tool":"quickbooks.create_invoice","approval":true}]', 'succeeded', 5, 5, 12400, 1820, 35, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 hours', 'Contract signed; invoice queued for finance approval.'),
((SELECT id FROM agents WHERE slug='sales-exec'), (SELECT id FROM workflow_runs WHERE external_ref='SFDC-OPP-00875'), 'Draft Globex outbound and progress to demo', '[{"tool":"hubspot.search_contacts"},{"tool":"gmail.draft_reply","approval":true},{"tool":"sfdc.update_stage","approval":true}]', 'succeeded', 3, 3, 6200, 1110, 18, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day 22 hours', 'Demo booked 2026-05-16.'),
((SELECT id FROM agents WHERE slug='eng-exec'), (SELECT id FROM workflow_runs WHERE external_ref='INC-2026-0418'), 'Recover us-east-1 payment outage', '[{"tool":"slack.post_message"},{"tool":"github.open_pr","approval":true},{"tool":"linear.create_issue"}]', 'succeeded', 4, 4, 9400, 2200, 28, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '2 hours', 'Rolled back to v2.8.0; postmortem INFRA-1842 created.'),
((SELECT id FROM agents WHERE slug='cs-exec'), (SELECT id FROM workflow_runs WHERE external_ref='CS-SAVE-432'), 'Re-engage Wayne Enterprises', '[{"tool":"intercom.tag_user"},{"tool":"slack.post_message"}]', 'running', 4, 1, 2100, 380, 6, NOW() - INTERVAL '3 days', NULL, NULL),
((SELECT id FROM agents WHERE slug='finance-exec'), (SELECT id FROM workflow_runs WHERE external_ref='CLOSE-2026-04'), 'Recognize April revenue', '[{"tool":"netsuite.lookup_customer"}]', 'succeeded', 2, 2, 15400, 980, 41, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '2 hours', 'Recognized $4.28M.'),
((SELECT id FROM agents WHERE slug='analyst'), (SELECT id FROM workflow_runs WHERE external_ref='CLOSE-2026-04'), 'Generate AR aging buckets', NULL, 'succeeded', 1, 1, 5400, 720, 16, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '1 hour', '30d=$840k, 60d=$120k, 90d=$40k.'),
((SELECT id FROM agents WHERE slug='planner'), (SELECT id FROM workflow_runs WHERE external_ref='WB-2026-W19'), 'Draft week-19 brief', '[{"tool":"slack.post_message"}]', 'succeeded', 3, 3, 18200, 3400, 56, NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', 'Brief delivered to #leadership.'),
((SELECT id FROM agents WHERE slug='evaluator'), NULL, 'Audit last 24h of write actions', NULL, 'succeeded', 1, 1, 22000, 4100, 64, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '11 hours', 'No policy violations flagged.'),
((SELECT id FROM agents WHERE slug='router'), NULL, 'Route 412 support inbounds', NULL, 'succeeded', 1, 1, 41200, 6200, 92, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '7 hours 40 minutes', '88% routed automatically, 12% to L2.'),
((SELECT id FROM agents WHERE slug='sales-exec'), (SELECT id FROM workflow_runs WHERE external_ref='SFDC-OPP-00859'), 'Unblock Stark Industries legal review', NULL, 'blocked', 3, 1, 1800, 240, 5, NOW() - INTERVAL '10 days', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Agent tool calls (16 rows)
INSERT INTO agent_tool_calls (agent_run_id, tool_slug, call_order, args, result, status, latency_ms) VALUES
((SELECT id FROM agent_runs WHERE goal='Progress Acme renewal from contract to cash'), 'sfdc.query_opportunity', 1, '{"id":"006Bx..."}', '{"stage":"contract_signed","amount":480000}', 'ok', 412),
((SELECT id FROM agent_runs WHERE goal='Progress Acme renewal from contract to cash'), 'quickbooks.create_invoice', 2, '{"customer_id":"acme","amount_usd":480000}', '{"invoice_id":"QBO-INV-9921","status":"pending_approval"}', 'ok', 980),
((SELECT id FROM agent_runs WHERE goal='Draft Globex outbound and progress to demo'), 'hubspot.search_contacts', 1, '{"q":"globex.io"}', '{"results":[{"email":"buyer@globex.io","title":"Director Eng"}]}', 'ok', 240),
((SELECT id FROM agent_runs WHERE goal='Draft Globex outbound and progress to demo'), 'gmail.draft_reply', 2, '{"thread_id":"thr_88","body":"Hi …"}', '{"draft_id":"d_812"}', 'ok', 612),
((SELECT id FROM agent_runs WHERE goal='Draft Globex outbound and progress to demo'), 'sfdc.update_stage', 3, '{"opp_id":"006Bz...","stage":"demo_scheduled"}', '{"ok":true}', 'ok', 720),
((SELECT id FROM agent_runs WHERE goal='Recover us-east-1 payment outage'), 'slack.post_message', 1, '{"channel":"#oncall","text":"S1: payments 5xx"}', '{"ok":true}', 'ok', 142),
((SELECT id FROM agent_runs WHERE goal='Recover us-east-1 payment outage'), 'github.open_pr', 2, '{"repo":"acme/payments","head":"hotfix/rollback","base":"main","title":"Roll back v2.8.1"}', '{"pr":"#3192","status":"merged"}', 'ok', 4120),
((SELECT id FROM agent_runs WHERE goal='Recover us-east-1 payment outage'), 'linear.create_issue', 3, '{"team":"INFRA","title":"Postmortem: us-east-1 outage 2026-04-18"}', '{"id":"INFRA-1842"}', 'ok', 380),
((SELECT id FROM agent_runs WHERE goal='Re-engage Wayne Enterprises'), 'intercom.tag_user', 1, '{"user_id":"wayne_admin","tag":"churn_risk"}', '{"ok":true}', 'ok', 180),
((SELECT id FROM agent_runs WHERE goal='Recognize April revenue'), 'netsuite.lookup_customer', 1, '{"saved_search":"AR_Aging"}', '{"rows":412}', 'ok', 2200),
((SELECT id FROM agent_runs WHERE goal='Generate AR aging buckets'), 'netsuite.lookup_customer', 1, '{"saved_search":"AR_Aging"}', '{"buckets":{"30":840000,"60":120000,"90":40000}}', 'ok', 1900),
((SELECT id FROM agent_runs WHERE goal='Draft week-19 brief'), 'slack.post_message', 1, '{"channel":"#leadership","text":"Week 19 brief…"}', '{"ok":true}', 'ok', 220),
((SELECT id FROM agent_runs WHERE goal='Route 412 support inbounds'), 'zendesk.create_ticket', 1, '{"subject":"…","body":"…","requester_email":"a@b"}', '{"ticket_id":54321}', 'ok', 410),
((SELECT id FROM agent_runs WHERE goal='Unblock Stark Industries legal review'), 'sfdc.query_opportunity', 1, '{"id":"006Bw..."}', '{"stage":"legal_review","blockers":["redlines"]}', 'ok', 380),
((SELECT id FROM agent_runs WHERE goal='Unblock Stark Industries legal review'), 'gmail.draft_reply', 2, '{"thread_id":"thr_42"}', NULL, 'denied', 80),
((SELECT id FROM agent_runs WHERE goal='Audit last 24h of write actions'), 'sfdc.query_opportunity', 1, '{"filter":"LastModifiedDate>YESTERDAY AND Amount>50000"}', '{"violations":0}', 'ok', 920)
ON CONFLICT DO NOTHING;

-- Decision log (18 rows)
INSERT INTO decision_log (agent_run_id, workflow_run_id, decision_type, actor, subject, rationale, evidence, alternatives_considered, confidence_pct, reversible, human_approved) VALUES
((SELECT id FROM agent_runs WHERE goal='Progress Acme renewal from contract to cash'), (SELECT id FROM workflow_runs WHERE external_ref='SFDC-OPP-00874'), 'pricing_approval', 'agent:sales-exec', 'Acme 250-seat $40/seat', 'List price $50; volume discount per playbook tier 3', '{"playbook":"vol_tier3","seats":250}', '[{"price":50,"won_prob":62},{"price":45,"won_prob":78},{"price":40,"won_prob":89}]', 91, true, true),
((SELECT id FROM agent_runs WHERE goal='Progress Acme renewal from contract to cash'), (SELECT id FROM workflow_runs WHERE external_ref='SFDC-OPP-00874'), 'invoice_creation', 'agent:finance-exec', 'AR invoice QBO-INV-9921 for $480k', 'Contract signed; net-30; standard terms', '{"contract_url":"docusign://9921","net":30}', NULL, 98, false, true),
((SELECT id FROM agent_runs WHERE goal='Draft Globex outbound and progress to demo'), (SELECT id FROM workflow_runs WHERE external_ref='SFDC-OPP-00875'), 'outbound_personalization', 'agent:sales-exec', 'Globex director email opener', 'Recent hire signal + recent funding', '{"signals":["series_b_2026_04"],"linkedin":"..."}', '[{"opener":"funding_congrats"},{"opener":"product_pain"}]', 78, true, true),
((SELECT id FROM agent_runs WHERE goal='Recover us-east-1 payment outage'), (SELECT id FROM workflow_runs WHERE external_ref='INC-2026-0418'), 'rollback', 'agent:eng-exec', 'Revert payments to v2.8.0', '5xx > 8% sustained; canary failed', '{"err_rate":0.082,"canary":"failed"}', '[{"action":"forward_fix"},{"action":"rollback"},{"action":"failover"}]', 95, true, true),
((SELECT id FROM agent_runs WHERE goal='Recover us-east-1 payment outage'), (SELECT id FROM workflow_runs WHERE external_ref='INC-2026-0418'), 'customer_comms', 'human:cto@', 'Public status-page update', 'S1 severity + payments scope', '{"severity":"S1"}', '[{"option":"public_update"},{"option":"silent"}]', 100, true, NULL),
((SELECT id FROM agent_runs WHERE goal='Re-engage Wayne Enterprises'), (SELECT id FROM workflow_runs WHERE external_ref='CS-SAVE-432'), 'churn_intervention', 'agent:cs-exec', 'Tag Wayne admin as churn_risk', 'Health 42; engagement decline; sentiment negative', '{"score":42,"sentiment":-0.6}', '[{"play":"executive_call"},{"play":"product_workshop"},{"play":"discount"}]', 71, true, NULL),
((SELECT id FROM agent_runs WHERE goal='Generate AR aging buckets'), (SELECT id FROM workflow_runs WHERE external_ref='CLOSE-2026-04'), 'ar_classification', 'agent:analyst', 'Bucketize AR aging', 'NetSuite SuiteQL pull', '{"30d":840000}', NULL, 99, true, true),
((SELECT id FROM agent_runs WHERE goal='Draft week-19 brief'), (SELECT id FROM workflow_runs WHERE external_ref='WB-2026-W19'), 'brief_composition', 'agent:planner', 'Top 5 items for leadership brief', 'KPI deltas + open anomalies + decision log', '{"kpis_red":2,"kpis_yellow":4,"open_anomalies":7}', NULL, 88, true, true),
(NULL, NULL, 'access_review', 'human:cfo@', 'Approve finance-exec access to QuickBooks write', 'Finance close needs invoice creation; least-privilege', '{"new_scopes":["create_invoice"]}', NULL, 100, true, true),
(NULL, NULL, 'connector_change', 'human:cto@', 'Pause Greenhouse connector during renewal', 'Cost review', '{"monthly_cost":1500}', NULL, 100, true, true),
(NULL, (SELECT id FROM workflow_runs WHERE external_ref='SFDC-OPP-00859'), 'escalation', 'agent:sales-exec', 'Escalate Stark legal redlines to GC', '7 material redlines; >$1M deal', '{"redlines":7}', NULL, 80, true, NULL),
(NULL, NULL, 'kpi_target_change', 'human:cfo@', 'Bump NRR target 120→125 for FY27', 'Investor expectations + cohort data', '{"current":121}', NULL, 100, true, true),
(NULL, NULL, 'agent_deactivation', 'human:cto@', 'Pause sales-exec stage updates >$50k', 'Quarterly guardrail audit', '{"errors_30d":3}', NULL, 100, true, true),
((SELECT id FROM agent_runs WHERE goal='Route 412 support inbounds'), NULL, 'auto_route', 'agent:router', 'Routed 363/412 inbounds automatically', '88% intent classifier confidence > 0.85', '{"auto":363,"manual":49}', NULL, 92, true, true),
((SELECT id FROM agent_runs WHERE goal='Audit last 24h of write actions'), NULL, 'guardrail_audit', 'agent:evaluator', 'No policy violations 2026-05-12', '0 of 41 write actions flagged', '{"audited":41,"flagged":0}', NULL, 99, true, true),
(NULL, NULL, 'budget_reallocation', 'human:cmo@', 'Shift 30% paid → content', 'Content ROI 4.2x vs paid 1.8x', '{"paid_roi":1.8,"content_roi":4.2}', NULL, 95, true, true),
(NULL, NULL, 'hiring_freeze', 'human:cfo@', 'Pause non-eng req opening for Q2', 'Burn multiple 1.4 above target', '{"burn_multiple":1.4}', NULL, 100, true, true),
(NULL, NULL, 'security_revoke', 'human:ciso@', 'Revoke Zendesk OAuth (token expired)', 'Connector health red; rotation overdue', '{"days_since_rotation":92}', NULL, 100, false, true)
ON CONFLICT DO NOTHING;

-- Closed-loop tickets (12 rows)
INSERT INTO closed_loop_tickets (source_type, source_id, title, spec, assignee, external_url, status, priority, loop_closed_kpi, baseline_value, outcome_value, resolved_at, resolution_notes) VALUES
('anomaly', NULL, 'Payments 5xx spike on us-east-1', 'Open Linear issue INFRA-1842. Rollback to v2.8.0. Add canary gate for payments deploys.', 'agent:eng-exec', 'https://linear.app/acme/issue/INFRA-1842', 'resolved', 'critical', 'mttr', 5.1, 0.9, NOW() - INTERVAL '2 hours', 'Rollback restored service; canary gate added.'),
('insight', NULL, 'Engineering velocity declining 3 sprints', 'Reduce context switching: rotate on-call to dedicated SRE squad. Move feature work off oncall sprint.', 'human:em@', 'https://linear.app/acme/issue/ENG-2204', 'in_progress', 'high', NULL, 71, NULL, NULL, NULL),
('kpi_breach', NULL, 'CAC above target 4 quarters running', 'Audit paid channel attribution; sunset bottom-quartile keywords; rebalance to content.', 'human:cmo@', 'https://linear.app/acme/issue/MKTG-501', 'in_progress', 'high', 'cac', 9800, NULL, NULL, NULL),
('anomaly', NULL, 'Stripe refund pattern: 14 in 2h', 'Investigate billing bug suspected in promo-code edge case. Escalate to billing team.', 'agent:cs-exec', 'https://linear.app/acme/issue/BILL-91', 'resolved', 'high', 'csat', 89, 91, NOW() - INTERVAL '5 days', 'Promo code coupon-stack bug fixed; refunds reissued.'),
('insight', NULL, 'AWS cost growing 2.3x revenue growth', 'Procure 1y reserved instances; rightsize non-prod; enable S3 IA tiering.', 'human:devops_lead@', 'https://linear.app/acme/issue/INFRA-1812', 'in_progress', 'medium', NULL, NULL, NULL, NULL, NULL),
('anomaly', NULL, 'Slack engineering activity down 45%', 'CSAT-style pulse survey; investigate remote policy impact; team-cohesion playbook.', 'human:chro@', 'https://linear.app/acme/issue/PPL-77', 'open', 'medium', NULL, NULL, NULL, NULL, NULL),
('kpi_breach', NULL, 'NRR below 120 for 4 months', 'CS-led expansion plays for top-50 accounts; tighten renewal terms.', 'human:cs.lead@', 'https://linear.app/acme/issue/CS-441', 'resolved', 'high', 'nrr', 115, 121, NOW() - INTERVAL '10 days', 'Expansion plays added $1.4M; NRR crossed 120.'),
('insight', NULL, 'GitHub PR review time 4h → 18h', 'Define SLA: <8h PR review. Auto-nudge reviewers in Slack after 4h.', 'human:em@', 'https://linear.app/acme/issue/ENG-2188', 'in_progress', 'high', 'mttr', NULL, NULL, NULL, NULL),
('manual', NULL, 'Sales playbook update for SMB self-serve', 'Document new self-serve flow; update Salesforce stage definitions; train AEs.', 'human:vp.sales@', 'https://linear.app/acme/issue/SLS-122', 'resolved', 'medium', 'win_rate', 26, 29, NOW() - INTERVAL '14 days', 'Win rate up 3pp; cycle time -33%.'),
('anomaly', NULL, 'Zendesk connector 401s', 'Rotate Zendesk OAuth token. Add credential expiry monitor.', 'agent:eng-exec', 'https://linear.app/acme/issue/INFRA-1851', 'open', 'high', NULL, NULL, NULL, NULL, NULL),
('kpi_breach', NULL, 'Burn multiple 1.4 vs 1.0 target', 'Hiring freeze non-eng; renegotiate top-5 SaaS contracts; defer Greenhouse renewal.', 'human:cfo@', 'https://linear.app/acme/issue/FIN-301', 'in_progress', 'critical', 'burn_multiple', 1.4, NULL, NULL, NULL),
('insight', NULL, 'PQL converts at 3.2x rate', 'Double PLG signup ad budget; instrument activation events more tightly.', 'human:head.growth@', 'https://linear.app/acme/issue/PRD-902', 'resolved', 'high', 'win_rate', 26, 29, NOW() - INTERVAL '21 days', 'PLG bucket converting at 3.4x; pipeline +18%.')
ON CONFLICT DO NOTHING;
