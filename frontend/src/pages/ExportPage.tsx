import { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { downloadCsv } from '../api';

const RESOURCES = [
  { key: 'sources',   label: 'Data Sources',     desc: 'All data source configurations' },
  { key: 'events',    label: 'Events',           desc: 'Event log with source name joined' },
  { key: 'insights',  label: 'Insights',         desc: 'Generated insights and assignments' },
  { key: 'anomalies', label: 'Anomalies',        desc: 'Detected anomalies with source name' },
  { key: 'queries',   label: 'Saved Queries',    desc: 'Saved natural-language and SQL queries' },
  { key: 'health',    label: 'Health Scores',    desc: 'Departmental health scores history' },
  { key: 'activity',  label: 'Activity Log',     desc: 'User and system activity entries' },
];

export default function ExportPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const handleDownload = async (key: string) => {
    setBusy(key); setError(null);
    try {
      await downloadCsv(key);
      setLastExport(`${key} exported at ${new Date().toLocaleTimeString()}`);
    } catch (e) {
      setError((e as Error).message || 'Export failed');
    } finally { setBusy(null); }
  };

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center"><FileSpreadsheet className="w-5 h-5 text-white" /></div>
        <div><h1 className="text-2xl font-bold text-white">CSV Export</h1><p className="text-gray-400 text-sm">Download any resource as a CSV file</p></div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {lastExport && <p className="text-emerald-400 text-sm mb-4">{lastExport}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-4xl">
        {RESOURCES.map(r => (
          <div key={r.key} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{r.label}</p>
              <p className="text-gray-500 text-xs mt-1">{r.desc}</p>
            </div>
            <button
              onClick={() => handleDownload(r.key)}
              disabled={busy === r.key}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2 px-3 rounded-lg text-sm disabled:opacity-50">
              <Download className="w-4 h-4" />{busy === r.key ? '...' : 'CSV'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
