import { useMemo } from 'react';

export type GraphNode = {
  id: string;
  label: string;
  kind: 'workflow' | 'step' | 'agent';
  order?: number;
  agent?: string | null;
  runs_here?: number;
  group?: number;
  departments?: string | null;
  active?: boolean;
};
export type GraphEdge = { source: string; target: string; kind: string };
export type GraphStats = { workflow_count: number; step_count: number; agent_count: number };

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats?: GraphStats;
};

const KIND_COLOR: Record<string, string> = {
  workflow: '#14b8a6',
  step: '#0ea5e9',
  agent: '#a855f7'
};

// Deterministic layout: workflows on the left column, their steps in a row,
// agents column on the right.
function layout(nodes: GraphNode[]) {
  const wfNodes = nodes.filter(n => n.kind === 'workflow');
  const agentNodes = nodes.filter(n => n.kind === 'agent');
  const stepNodes = nodes.filter(n => n.kind === 'step');

  const positions: Record<string, { x: number; y: number }> = {};
  const rowHeight = 90;
  const baseY = 60;
  // Workflows column (left)
  wfNodes.forEach((n, i) => {
    positions[n.id] = { x: 90, y: baseY + i * rowHeight };
  });
  // Steps: laid out in a horizontal line per workflow row
  const stepsByWf: Record<number, GraphNode[]> = {};
  stepNodes.forEach(s => {
    const g = s.group ?? 0;
    if (!stepsByWf[g]) stepsByWf[g] = [];
    stepsByWf[g].push(s);
  });
  Object.entries(stepsByWf).forEach(([gStr, steps]) => {
    const g = Number(gStr);
    steps.sort((a, b) => (a.order || 0) - (b.order || 0));
    steps.forEach((s, idx) => {
      positions[s.id] = { x: 240 + idx * 130, y: baseY + g * rowHeight };
    });
  });
  // Agents on the far right
  const agentCol = Math.max(
    ...Object.values(stepsByWf).map(arr => 240 + arr.length * 130),
    600
  );
  agentNodes.forEach((a, i) => {
    positions[a.id] = { x: agentCol + 40, y: baseY + i * 60 };
  });
  return positions;
}

export default function WorkflowGraph({ nodes, edges, stats }: Props) {
  const positions = useMemo(() => layout(nodes), [nodes]);
  const width = Math.max(900, ...Object.values(positions).map(p => p.x + 140));
  const height = Math.max(360, ...Object.values(positions).map(p => p.y + 80));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4" data-testid="workflow-graph">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-white font-semibold">Workflow Graph</div>
          <div className="text-xs text-gray-400">Workflows fan out to their steps; agents bind on the right.</div>
        </div>
        {stats && (
          <div className="flex gap-2 text-[11px]">
            <span className="px-2 py-1 rounded bg-teal-500/10 text-teal-300 border border-teal-500/30">
              {stats.workflow_count} workflows
            </span>
            <span className="px-2 py-1 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30">
              {stats.step_count} steps
            </span>
            <span className="px-2 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
              {stats.agent_count} agents
            </span>
          </div>
        )}
      </div>
      <div className="overflow-auto max-h-[560px] rounded-lg bg-gray-950/60 border border-gray-800">
        <svg width={width} height={height} className="block">
          {edges.map((e, i) => {
            const a = positions[e.source]; const b = positions[e.target];
            if (!a || !b) return null;
            const stroke = e.kind === 'uses' ? '#a855f7' : '#475569';
            const dash = e.kind === 'uses' ? '4 3' : undefined;
            return (
              <line key={`e-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={stroke} strokeWidth={1.4} strokeDasharray={dash} opacity={0.75} />
            );
          })}
          {nodes.map(n => {
            const p = positions[n.id]; if (!p) return null;
            const c = KIND_COLOR[n.kind] || '#64748b';
            const r = n.kind === 'workflow' ? 22 : n.kind === 'step' ? 16 : 14;
            return (
              <g key={n.id} transform={`translate(${p.x},${p.y})`}>
                <circle r={r} fill={c} fillOpacity={0.18} stroke={c} strokeWidth={1.8} />
                <text x={0} y={r + 14} textAnchor="middle" fill="#e5e7eb" fontSize={11}>
                  {n.label.length > 22 ? n.label.slice(0, 21) + '…' : n.label}
                </text>
                {n.kind === 'step' && typeof n.runs_here === 'number' && n.runs_here > 0 && (
                  <text x={0} y={4} textAnchor="middle" fill="#fff" fontSize={10}>{n.runs_here}</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
