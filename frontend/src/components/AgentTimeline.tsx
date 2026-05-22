export type TimelineItem = {
  id: number;
  agent: string;
  agent_name: string;
  role: string | null;
  goal: string;
  status: string;
  start_ms: number;
  end_ms: number;
  duration_ms: number;
  steps_planned: number;
  steps_completed: number;
  tokens: number;
  cost_cents: number;
};

type Props = {
  items: TimelineItem[];
  window: { start_ms: number; end_ms: number; span_ms: number };
  totals: { tokens: number; cost_cents: number; by_status: Record<string, number> };
};

const STATUS_COLOR: Record<string, string> = {
  running: '#facc15',
  succeeded: '#34d399',
  failed: '#f87171',
  cancelled: '#94a3b8',
  blocked: '#fb923c'
};

function fmtDur(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = s / 60;
  if (m < 60) return `${m.toFixed(1)}m`;
  return `${(m / 60).toFixed(1)}h`;
}

export default function AgentTimeline({ items, window: win, totals }: Props) {
  const span = Math.max(1, win.span_ms);
  // Group by agent for swimlanes
  const agents = Array.from(new Set(items.map(i => i.agent)));
  const laneH = 38;
  const labelW = 160;
  const trackW = 720;
  const height = Math.max(140, agents.length * laneH + 40);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4" data-testid="agent-timeline">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-white font-semibold">Agent Execution Timeline</div>
          <div className="text-xs text-gray-400">
            {items.length} runs · {totals.tokens.toLocaleString()} tokens · ${(totals.cost_cents / 100).toFixed(2)} cost
          </div>
        </div>
        <div className="flex gap-2 text-[11px]">
          {Object.entries(totals.by_status).map(([k, v]) => (
            <span key={k} className="px-2 py-1 rounded border"
              style={{ color: STATUS_COLOR[k] || '#cbd5e1', borderColor: (STATUS_COLOR[k] || '#475569') + '66' }}>
              {k}: {v}
            </span>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg bg-gray-950/60 border border-gray-800">
        <svg width={labelW + trackW + 20} height={height} className="block">
          {agents.map((ag, li) => {
            const y = 20 + li * laneH;
            return (
              <g key={ag}>
                <text x={10} y={y + 18} fill="#e5e7eb" fontSize={12}>{ag}</text>
                <line x1={labelW} y1={y + 26} x2={labelW + trackW} y2={y + 26}
                  stroke="#1f2937" strokeWidth={1} />
                {items.filter(it => it.agent === ag).map(it => {
                  const x = labelW + ((it.start_ms - win.start_ms) / span) * trackW;
                  const w = Math.max(4, ((it.end_ms - it.start_ms) / span) * trackW);
                  const c = STATUS_COLOR[it.status] || '#94a3b8';
                  return (
                    <g key={it.id}>
                      <rect x={x} y={y + 6} width={w} height={22} rx={4}
                        fill={c} fillOpacity={0.25} stroke={c} strokeWidth={1.2}>
                        <title>
                          {`${it.agent_name} · ${it.status}\n${it.goal}\n${fmtDur(it.duration_ms)}`}
                        </title>
                      </rect>
                      <text x={x + 4} y={y + 22} fill="#e5e7eb" fontSize={10}>
                        {fmtDur(it.duration_ms)}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-3 max-h-48 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="text-gray-400">
            <tr><th className="text-left p-1">Agent</th><th className="text-left p-1">Goal</th>
              <th className="text-left p-1">Status</th><th className="text-right p-1">Dur</th>
              <th className="text-right p-1">Tokens</th></tr>
          </thead>
          <tbody className="text-gray-300">
            {items.slice(0, 30).map(it => (
              <tr key={it.id} className="border-t border-gray-800">
                <td className="p-1">{it.agent}</td>
                <td className="p-1 truncate max-w-[280px]">{it.goal}</td>
                <td className="p-1" style={{ color: STATUS_COLOR[it.status] || '#cbd5e1' }}>{it.status}</td>
                <td className="p-1 text-right">{fmtDur(it.duration_ms)}</td>
                <td className="p-1 text-right">{it.tokens.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
