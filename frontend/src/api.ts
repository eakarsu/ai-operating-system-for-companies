const BASE = '/api';
function headers() {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}
export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: headers() });
  if (!res.ok) {
    let msg = `API error: ${res.status}`;
    try { const body = await res.json(); if (body?.error) msg = body.error; } catch { /* ignore */ }
    const err = new Error(msg) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export function csvDownloadUrl(resource: string) {
  return `${BASE}/export/${resource}`;
}

export async function downloadCsv(resource: string) {
  const token = localStorage.getItem('token');
  const res = await fetch(csvDownloadUrl(resource), {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${resource}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  login: (email: string, password: string) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  sources: { list: () => apiFetch('/sources'), get: (id: number) => apiFetch(`/sources/${id}`), create: (d: object) => apiFetch('/sources', { method: 'POST', body: JSON.stringify(d) }), update: (id: number, d: object) => apiFetch(`/sources/${id}`, { method: 'PUT', body: JSON.stringify(d) }), delete: (id: number) => apiFetch(`/sources/${id}`, { method: 'DELETE' }) },
  events: { list: () => apiFetch('/events'), get: (id: number) => apiFetch(`/events/${id}`), create: (d: object) => apiFetch('/events', { method: 'POST', body: JSON.stringify(d) }), update: (id: number, d: object) => apiFetch(`/events/${id}`, { method: 'PUT', body: JSON.stringify(d) }), delete: (id: number) => apiFetch(`/events/${id}`, { method: 'DELETE' }) },
  insights: { list: () => apiFetch('/insights'), get: (id: number) => apiFetch(`/insights/${id}`), create: (d: object) => apiFetch('/insights', { method: 'POST', body: JSON.stringify(d) }), update: (id: number, d: object) => apiFetch(`/insights/${id}`, { method: 'PUT', body: JSON.stringify(d) }), delete: (id: number) => apiFetch(`/insights/${id}`, { method: 'DELETE' }) },
  anomalies: { list: () => apiFetch('/anomalies'), get: (id: number) => apiFetch(`/anomalies/${id}`), create: (d: object) => apiFetch('/anomalies', { method: 'POST', body: JSON.stringify(d) }), update: (id: number, d: object) => apiFetch(`/anomalies/${id}`, { method: 'PUT', body: JSON.stringify(d) }), delete: (id: number) => apiFetch(`/anomalies/${id}`, { method: 'DELETE' }) },
  queries: { list: () => apiFetch('/queries'), get: (id: number) => apiFetch(`/queries/${id}`), create: (d: object) => apiFetch('/queries', { method: 'POST', body: JSON.stringify(d) }), update: (id: number, d: object) => apiFetch(`/queries/${id}`, { method: 'PUT', body: JSON.stringify(d) }), delete: (id: number) => apiFetch(`/queries/${id}`, { method: 'DELETE' }) },
  health: { list: () => apiFetch('/health'), get: (id: number) => apiFetch(`/health/${id}`), create: (d: object) => apiFetch('/health', { method: 'POST', body: JSON.stringify(d) }), update: (id: number, d: object) => apiFetch(`/health/${id}`, { method: 'PUT', body: JSON.stringify(d) }), delete: (id: number) => apiFetch(`/health/${id}`, { method: 'DELETE' }) },
  ai: {
    generateInsights: (focus_area: string, time_range: string) => apiFetch('/ai/generate-insights', { method: 'POST', body: JSON.stringify({ focus_area, time_range }) }),
    query: (question: string) => apiFetch('/ai/query', { method: 'POST', body: JSON.stringify({ question }) }),
    anomalyExplanation: (anomaly_id: number, anomaly_description: string) => apiFetch('/ai/anomaly-explanation', { method: 'POST', body: JSON.stringify({ anomaly_id, anomaly_description }) }),
    healthAnalysis: (department: string) => apiFetch('/ai/health-analysis', { method: 'POST', body: JSON.stringify({ department }) }),
    crossSourceInsight: (source_ids: number[]) => apiFetch('/ai/cross-source-insight', { method: 'POST', body: JSON.stringify({ source_ids }) }),
    anomalyCluster: (status: string) => apiFetch('/ai/anomaly-cluster', { method: 'POST', body: JSON.stringify({ status }) }),
    kpiForecast: (metric: string, horizon: string) => apiFetch('/ai/kpi-forecast', { method: 'POST', body: JSON.stringify({ metric, horizon }) }),
    weeklyBrief: () => apiFetch('/ai/weekly-brief', { method: 'POST', body: JSON.stringify({}) }),
    queryNarrate: (question: string, rows: object[]) => apiFetch('/ai/query-narrate', { method: 'POST', body: JSON.stringify({ question, rows }) })
  },
  activity: {
    list: (params?: { entity_type?: string; entity_id?: number; action?: string; limit?: number }) => {
      const q = params ? '?' + Object.entries(params).filter(([_,v])=>v!==undefined&&v!==null&&v!=='').map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&') : '';
      return apiFetch(`/activity${q}`);
    },
    create: (d: object) => apiFetch('/activity', { method: 'POST', body: JSON.stringify(d) })
  },
  search: (params: { q?: string; entities?: string; severity?: string; status?: string; impact?: string; category?: string; department?: string; from?: string; to?: string }) => {
    const q = '?' + Object.entries(params).filter(([_,v])=>v!==undefined&&v!==null&&v!=='').map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
    return apiFetch(`/search${q}`);
  }
};
