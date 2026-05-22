import { useState } from 'react';
import { apiFetch } from '../api';

const sample = JSON.stringify({
  policies: [
    { policy: 'Vendor onboarding SLA', owner: 'Procurement Ops', current: 64, target: 90, tolerance: 8, age_days: 52, criticality: 'high' },
    { policy: 'Customer escalation ownership', owner: 'Support', current: 82, target: 95, tolerance: 6, age_days: 18, criticality: 'medium' },
    { policy: 'Quarterly access recertification', owner: 'IT Governance', current: 71, target: 100, tolerance: 4, age_days: 83, criticality: 'critical' }
  ]
}, null, 2);

export default function PolicyDriftSimulator() {
  const [payload, setPayload] = useState(sample);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const run = async () => {
    setError('');
    try {
      const body = JSON.parse(payload);
      setResult(await apiFetch('/policy-drift/simulate', { method: 'POST', body: JSON.stringify(body) }));
    } catch (err: any) {
      setError(err.message || 'Could not simulate policy drift.');
    }
  };

  return (
    <div className="h-full overflow-auto p-8 bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Policy Drift Simulator</h1>
          <p className="text-gray-400 mt-1">Model which operating policies are drifting from owner targets before workflows inherit bad assumptions.</p>
        </div>
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
          <section className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-4">
            <textarea className="w-full h-96 bg-gray-950 border border-gray-800 rounded-lg p-3 text-sm font-mono text-gray-200" value={payload} onChange={(event) => setPayload(event.target.value)} />
            <button onClick={run} className="px-4 py-2 rounded-lg bg-teal-500 text-gray-950 font-semibold hover:bg-teal-400">Run Simulation</button>
            {error && <div className="text-sm text-red-400">{error}</div>}
          </section>
          <section className="bg-gray-900 border border-gray-800 rounded-lg p-5">
            {!result ? <div className="text-gray-500">Simulation results appear here.</div> : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-950 rounded-lg p-4 border border-gray-800"><div className="text-xs text-gray-500">Average Risk</div><div className="text-2xl font-bold text-teal-300">{result.averageRisk}</div></div>
                  <div className="bg-gray-950 rounded-lg p-4 border border-gray-800"><div className="text-xs text-gray-500">Policies</div><div className="text-2xl font-bold">{result.policyCount}</div></div>
                  <div className="bg-gray-950 rounded-lg p-4 border border-gray-800"><div className="text-xs text-gray-500">Escalations</div><div className="text-2xl font-bold text-amber-300">{result.escalationCount}</div></div>
                </div>
                {result.policies.map((item: any) => (
                  <div key={`${item.policy}-${item.owner}`} className="bg-gray-950 border border-gray-800 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div><div className="font-semibold">{item.policy}</div><div className="text-sm text-gray-500">{item.owner} · {item.criticality}</div></div>
                      <div className="text-right"><div className="text-lg font-bold">{item.score}</div><div className="text-xs uppercase text-teal-300">{item.severity}</div></div>
                    </div>
                    <div className="text-sm text-gray-300 mt-3">{item.action}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
