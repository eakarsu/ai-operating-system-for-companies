export interface HeatmapDept { slug: string; name: string; headcount?: number }
export interface HeatmapCell {
  dept_slug: string; runs: number; tokens: number; cost_cents: number; success: number; failed: number;
}
export interface HeatmapRow {
  agent_slug: string; agent_name: string; role?: string | null; model?: string | null;
  active?: boolean; cells: HeatmapCell[]; total_runs: number;
}
export interface HeatmapData {
  departments: HeatmapDept[];
  agents: { slug: string; name: string; department?: string | null; active?: boolean }[];
  matrix: HeatmapRow[];
  max_cell_runs: number;
  totals: { agents: number; departments: number; total_runs: number };
}

function cellColor(v: number, max: number): string {
  if (max <= 0 || v <= 0) return 'rgb(20,24,33)';
  const pct = Math.min(1, v / max);
  // teal scale
  const r = Math.round(13 + (45 - 13) * pct);
  const g = Math.round(60 + (212 - 60) * pct);
  const b = Math.round(80 + (180 - 80) * pct);
  return `rgb(${r},${g},${b})`;
}

export default function ResourceUtilizationHeatmap({ data }: { data: HeatmapData }) {
  const { departments, matrix, max_cell_runs, totals } = data;
  return (
    <div data-testid="resource-utilization-heatmap" className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
          <div className="text-[10px] uppercase tracking-wide text-gray-500">Agents</div>
          <div className="text-xl font-semibold text-teal-300">{totals.agents}</div>
        </div>
        <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
          <div className="text-[10px] uppercase tracking-wide text-gray-500">Departments</div>
          <div className="text-xl font-semibold text-teal-300">{totals.departments}</div>
        </div>
        <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
          <div className="text-[10px] uppercase tracking-wide text-gray-500">Total Runs</div>
          <div className="text-xl font-semibold text-teal-300">{totals.total_runs}</div>
        </div>
        <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
          <div className="text-[10px] uppercase tracking-wide text-gray-500">Peak Cell</div>
          <div className="text-xl font-semibold text-teal-300">{max_cell_runs}</div>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-gray-900 border border-gray-800 overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-white">Agent x Department - run intensity</div>
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <span>low</span>
            <span className="inline-block w-3 h-3" style={{ background: cellColor(0, 1) }} />
            <span className="inline-block w-3 h-3" style={{ background: cellColor(0.25, 1) }} />
            <span className="inline-block w-3 h-3" style={{ background: cellColor(0.5, 1) }} />
            <span className="inline-block w-3 h-3" style={{ background: cellColor(0.75, 1) }} />
            <span className="inline-block w-3 h-3" style={{ background: cellColor(1, 1) }} />
            <span>high</span>
          </div>
        </div>

        <table className="text-[11px] border-separate" style={{ borderSpacing: 2 }}>
          <thead>
            <tr>
              <th className="text-left text-gray-400 pr-2 sticky left-0 bg-gray-900 z-10">Agent</th>
              {departments.map(d => (
                <th key={d.slug} className="text-gray-400 px-1 text-center" title={d.name}>
                  <div className="rotate-[-30deg] origin-bottom-left whitespace-nowrap inline-block" style={{ minWidth: 36 }}>
                    {d.slug}
                  </div>
                </th>
              ))}
              <th className="text-gray-400 px-2 text-right">Σ</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map(row => (
              <tr key={row.agent_slug}>
                <td className="pr-2 text-gray-200 whitespace-nowrap sticky left-0 bg-gray-900 z-10">
                  <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${row.active === false ? 'bg-gray-600' : 'bg-emerald-400'}`} />
                  {row.agent_name}
                </td>
                {row.cells.map(c => (
                  <td key={c.dept_slug} className="text-center align-middle"
                      title={`${row.agent_slug} x ${c.dept_slug}\nruns: ${c.runs}\ntokens: ${c.tokens}\nsucc/fail: ${c.success}/${c.failed}`}>
                    <div className="w-9 h-7 flex items-center justify-center rounded text-[10px] text-white"
                         style={{ background: cellColor(c.runs, max_cell_runs) }}>
                      {c.runs > 0 ? c.runs : ''}
                    </div>
                  </td>
                ))}
                <td className="text-right pl-2 text-teal-300">{row.total_runs}</td>
              </tr>
            ))}
            {matrix.length === 0 && (
              <tr><td colSpan={departments.length + 2} className="text-center py-3 text-gray-500">No agents/runs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
