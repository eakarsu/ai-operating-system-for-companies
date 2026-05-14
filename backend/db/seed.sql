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
