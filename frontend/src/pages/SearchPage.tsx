import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { api } from '../api';

type ResultBundle = {
  total: number;
  results: Record<string, Array<Record<string, unknown>>>;
};

const ENTITY_OPTIONS = [
  { value: 'sources', label: 'Sources' },
  { value: 'events', label: 'Events' },
  { value: 'insights', label: 'Insights' },
  { value: 'anomalies', label: 'Anomalies' },
  { value: 'queries', label: 'Queries' },
  { value: 'health', label: 'Health' },
];

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [entities, setEntities] = useState<string[]>(ENTITY_OPTIONS.map(e => e.value));
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [impact, setImpact] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ResultBundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setData(null);
    try {
      const res = await api.search({
        q, entities: entities.join(','),
        severity, status, impact, category, department, from, to
      });
      setData(res as ResultBundle);
    } catch (err) {
      setError((err as Error).message || 'Search failed');
    } finally { setLoading(false); }
  };

  const toggleEntity = (val: string) => {
    setEntities(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);
  };

  const summarizeRow = (key: string, row: Record<string, unknown>): { title: string; sub: string } => {
    switch (key) {
      case 'sources': return { title: String(row.name || ''), sub: `${row.type || ''} • ${row.status || ''}` };
      case 'events': return { title: String(row.title || ''), sub: `${row.event_type || ''} • ${row.severity || ''} • ${row.source_name || ''}` };
      case 'insights': return { title: String(row.title || ''), sub: `${row.category || ''} • impact: ${row.impact || ''}` };
      case 'anomalies': return { title: String(row.metric_name || ''), sub: `${row.severity || ''} • dev: ${row.deviation_pct || ''}% • ${row.status || ''}` };
      case 'queries': return { title: String(row.name || ''), sub: `runs: ${row.run_count || 0}` };
      case 'health': return { title: String(row.department || ''), sub: `score: ${row.overall_score || ''} • trend: ${row.trend || ''}` };
      default: return { title: JSON.stringify(row).slice(0, 100), sub: '' };
    }
  };

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center"><Search className="w-5 h-5 text-white" /></div>
        <div><h1 className="text-2xl font-bold text-white">Search & Filter</h1><p className="text-gray-400 text-sm">Search across all entities with combined filters</p></div>
      </div>

      <form onSubmit={submit} className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6 max-w-4xl space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Search term</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Free text..." className={inp+" pl-10"} />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Entities</label>
          <div className="flex flex-wrap gap-2">
            {ENTITY_OPTIONS.map(opt => (
              <button type="button" key={opt.value} onClick={()=>toggleEntity(opt.value)} className={`px-3 py-1 rounded-lg text-xs font-medium border ${entities.includes(opt.value) ? 'bg-teal-500/20 text-teal-300 border-teal-500/50' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>{opt.label}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className="block text-xs text-gray-400 mb-1">Severity</label><select value={severity} onChange={e=>setSeverity(e.target.value)} className={inp}><option value="">Any</option>{['info','low','medium','high','critical'].map(v=><option key={v}>{v}</option>)}</select></div>
          <div><label className="block text-xs text-gray-400 mb-1">Status</label><input value={status} onChange={e=>setStatus(e.target.value)} className={inp} placeholder="open, new..." /></div>
          <div><label className="block text-xs text-gray-400 mb-1">Impact</label><select value={impact} onChange={e=>setImpact(e.target.value)} className={inp}><option value="">Any</option>{['critical','high','medium','low'].map(v=><option key={v}>{v}</option>)}</select></div>
          <div><label className="block text-xs text-gray-400 mb-1">Category</label><input value={category} onChange={e=>setCategory(e.target.value)} className={inp} placeholder="financial..." /></div>
          <div><label className="block text-xs text-gray-400 mb-1">Department</label><input value={department} onChange={e=>setDepartment(e.target.value)} className={inp} placeholder="Engineering..." /></div>
          <div><label className="block text-xs text-gray-400 mb-1">From</label><input type="date" value={from} onChange={e=>setFrom(e.target.value)} className={inp} /></div>
          <div><label className="block text-xs text-gray-400 mb-1">To</label><input type="date" value={to} onChange={e=>setTo(e.target.value)} className={inp} /></div>
          <div className="flex items-end"><button type="submit" disabled={loading} className="w-full bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"><Filter className="w-4 h-4"/>{loading ? 'Searching...' : 'Search'}</button></div>
        </div>
      </form>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      {data && (
        <div className="space-y-5 max-w-4xl">
          <p className="text-gray-400 text-sm">{data.total} results across {Object.values(data.results).filter(arr => arr.length).length} entities</p>
          {Object.entries(data.results).map(([key, rows]) => rows.length > 0 && (
            <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-teal-300 font-semibold text-sm mb-3 uppercase tracking-wide">{key} ({rows.length})</h3>
              <ul className="space-y-1">
                {rows.slice(0, 30).map((row, i) => {
                  const s = summarizeRow(key, row);
                  return (
                    <li key={i} className="text-sm py-1.5 border-b border-gray-800 last:border-b-0">
                      <span className="text-white">{s.title || '(untitled)'}</span>
                      {s.sub && <span className="text-gray-500 ml-2 text-xs">— {s.sub}</span>}
                    </li>
                  );
                })}
              </ul>
              {rows.length > 30 && <p className="text-xs text-gray-500 mt-2">+{rows.length - 30} more...</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
