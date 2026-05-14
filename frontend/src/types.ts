export interface DataSource {
  id: number;
  name: string;
  type: string;
  connection_string: string;
  sync_frequency: string;
  status: string;
  last_synced_at: string;
  record_count: number;
  description: string;
  owner: string;
  tags: string;
  created_at: string;
}

export interface Event {
  id: number;
  source_id: number;
  source_name: string;
  event_type: string;
  title: string;
  description: string;
  payload: object;
  severity: string;
  status: string;
  occurred_at: string;
  created_at: string;
}

export interface Insight {
  id: number;
  title: string;
  category: string;
  content: string;
  confidence_score: number;
  impact: string;
  action_required: boolean;
  assigned_to: string;
  status: string;
  tags: string;
  created_at: string;
}

export interface Anomaly {
  id: number;
  source_id: number;
  source_name: string;
  metric_name: string;
  expected_value: number;
  actual_value: number;
  deviation_pct: number;
  severity: string;
  description: string;
  status: string;
  detected_at: string;
  resolved_at: string;
}

export interface SavedQuery {
  id: number;
  name: string;
  query_text: string;
  query_type: string;
  result_summary: string;
  tags: string;
  is_scheduled: boolean;
  schedule_frequency: string;
  run_count: number;
  last_run_at: string;
  created_at: string;
}

export interface HealthScore {
  id: number;
  department: string;
  overall_score: number;
  productivity_score: number;
  velocity_score: number;
  quality_score: number;
  collaboration_score: number;
  trend: string;
  notes: string;
  period: string;
  recorded_at: string;
}
