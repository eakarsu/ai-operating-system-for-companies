import { useMemo } from 'react';

export interface ProcessBucket {
  date: string;
  ts_ms: number;
  running: number;
  succeeded: number;
  failed: number;
  blocked: number;
  cancelled: number;
  sla_breached: number;
  total: number;
}
export interface ProcessByWorkflow {
  workflow_slug: string;
  workflow_name: string;
  runs: number;
  succeeded: number;
  failed: number;
  total_amount_usd: number;
}
export interface ProcessActivityData {
  window: { days: number; start_ms: number; end_ms: number };
  buckets: ProcessBucket[];
  by_workflow: ProcessByWorkflow[];
  totals: { total: number; by_status: Record<string, number>; sla_breached: number };
}

const STATUS_COLORS: Record<string, string> = {
  succeeded: '#10b981',
  running:   '#3b82f6',
  blocked:   '#f59e0b',
  failed:    '#ef4444',
  cancelled: '#6b7280'
};
const STACK_ORDER: (keyof ProcessBucket)[] = ['succeeded', 'running', 'blocked', 'failed', 'cancelled'];

export default function ProcessActivityChart({ data }: { data: ProcessActivityData }) {
  const { buckets, by_workflow, totals } = data;
  const maxTotal = useMemo(() => Math.max(1, ...buckets.map(b => b.total)), [buckets]);
  const chartH = 220;
  const barW = Math.max(8, Math.floor(640 / Math.max(1, buckets.length)) - 2);

  return (
    <div data-testid="process-activity-chart" className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { l: 'Total Runs', v: totals.total, c: 'text-teal-300' },
          { l: 'Succeeded', v: totals.by_status['succeeded'] || 0, c: 'text-green-300' },
          { l: 'Failed', v: totals.by_status['failed'] || 0, c: 'text-red-300' },
          { l: 'Running', v: totals.by_status['running'] || 0, c: 'text-blue-300' },
          { l: 'SLA Breaches', v: totals.sla_breached, c: 'text-amber-300' }
        ].map(s => (
          <div key={s.l} className="p-3 rounded-lg bg-gray-900 border border-gray-800">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">{s.l}</div>
            <div className={`text-xl font-semibold mt-1 ${s.c}`}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-white">Workflow Runs by Day ({data.window.days}d)</div>
          <div className="flex items-center gap-3 text-[11px]">
            {STACK_ORDER.map(s => (
              <span key={String(s)} className="inline-flex items-center gap-1 text-gray-400">
                <span className="w-2.5 h-2.5 rounded" style={{ background: STATUS_COLORS[String(s)] }} />
                {String(s)}
              </span>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <svg width={Math.max(640, buckets.length * (barW + 2))} height={chartH + 30} className="block">
            {buckets.map((b, i) => {
              let yCursor = chartH;
              const x = i * (barW + 2);
              return (
                <g key={b.date}>
                  {STACK_ORDER.map(seg => {
                    const v = Number((b as any)[seg]) || 0;
                    if (v <= 0) return null;
                    const h = Math.round((v / maxTotal) * chartH);
                    yCursor -= h;
                    return (
                      <rect
                        key={String(seg)}
                        x={x} y={yCursor}
                        width={barW} height={h}
                        fill={STATUS_COLORS[String(seg)]}
                        opacity={0.85}
                      >
                        <title>{`${b.date} - ${String(seg)}: ${v}`}</title>
                      </rect>
                    );
                  })}
                  {i % Math.max(1, Math.floor(buckets.length / 8)) === 0 && (
                    <text x={x} y={chartH + 14} fontSize={9} fill="#6b7280">{b.date.slice(5)}</text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
        <div className="text-sm font-medium text-white mb-2">Top Workflows</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-gray-400 border-b border-gray-800">
              <tr><th className="text-left py-1.5 px-2">Workflow</th>
                  <th className="text-right px-2">Runs</th>
                  <th className="text-right px-2">Succeeded</th>
                  <th className="text-right px-2">Failed</th>
                  <th className="text-right px-2">Amount ($)</th></tr>
            </thead>
            <tbody>
              {by_workflow.slice(0, 12).map(w => (
                <tr key={w.workflow_slug} className="border-b border-gray-800/50">
                  <td className="py-1.5 px-2 text-gray-200">{w.workflow_name}</td>
                  <td className="text-right px-2 text-teal-300">{w.runs}</td>
                  <td className="text-right px-2 text-green-300">{w.succeeded}</td>
                  <td className="text-right px-2 text-red-300">{w.failed}</td>
                  <td className="text-right px-2 text-gray-300">{w.total_amount_usd.toLocaleString()}</td>
                </tr>
              ))}
              {by_workflow.length === 0 && (
                <tr><td colSpan={5} className="py-3 text-center text-gray-500">No workflow data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
