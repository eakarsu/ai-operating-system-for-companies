import { Download, FileText } from 'lucide-react';

export interface OrgNode {
  id: number; slug: string; name: string; parent_id: number | null;
  head_email?: string | null; headcount?: number | null;
  cost_center?: string | null; charter?: string | null;
  children: OrgNode[];
}
export interface OrgChartPdfData {
  filename: string;
  mime: string;
  bytes: number;
  pdf_base64: string;
  preview_lines: string[];
  hierarchy: OrgNode[];
  department_count: number;
  total_headcount: number;
}

function downloadPdf(data: OrgChartPdfData) {
  const bin = atob(data.pdf_base64);
  const len = bin.length;
  const buf = new Uint8Array(len);
  for (let i = 0; i < len; i++) buf[i] = bin.charCodeAt(i);
  const blob = new Blob([buf], { type: data.mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = data.filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function NodeBlock({ node, depth }: { node: OrgNode; depth: number }) {
  return (
    <div className="ml-0" style={{ paddingLeft: depth * 16 }}>
      <div className="flex items-center gap-2 py-1">
        <FileText className="w-3.5 h-3.5 text-teal-400" />
        <span className="text-sm text-white">{node.name}</span>
        <span className="text-[10px] text-gray-500">[{node.slug}]</span>
        <span className="text-[10px] text-gray-400 ml-1">{node.headcount || 0} people</span>
        {node.head_email && <span className="text-[10px] text-gray-500">· {node.head_email}</span>}
      </div>
      {node.children.map(c => <NodeBlock key={c.id} node={c} depth={depth + 1} />)}
    </div>
  );
}

export default function OrgChartPdfExport({ data }: { data: OrgChartPdfData }) {
  return (
    <div data-testid="org-chart-pdf-export" className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
          <div className="text-[10px] uppercase tracking-wide text-gray-500">Departments</div>
          <div className="text-xl font-semibold text-teal-300">{data.department_count}</div>
        </div>
        <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
          <div className="text-[10px] uppercase tracking-wide text-gray-500">Total Headcount</div>
          <div className="text-xl font-semibold text-teal-300">{data.total_headcount}</div>
        </div>
        <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
          <div className="text-[10px] uppercase tracking-wide text-gray-500">PDF Size</div>
          <div className="text-xl font-semibold text-teal-300">{(data.bytes / 1024).toFixed(1)} KB</div>
        </div>
        <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
          <div className="text-[10px] uppercase tracking-wide text-gray-500">Filename</div>
          <div className="text-xs font-mono text-gray-300 mt-1 truncate" title={data.filename}>{data.filename}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => downloadPdf(data)}
          data-testid="org-pdf-download-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium">
          <Download className="w-4 h-4" /> Download Org Chart PDF
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
          <div className="text-sm font-medium text-white mb-2">Hierarchy</div>
          <div className="max-h-[460px] overflow-y-auto">
            {data.hierarchy.length === 0
              ? <div className="text-xs text-gray-500">No departments.</div>
              : data.hierarchy.map(n => <NodeBlock key={n.id} node={n} depth={0} />)}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
          <div className="text-sm font-medium text-white mb-2">PDF Preview (text)</div>
          <pre className="text-[11px] text-gray-300 whitespace-pre-wrap font-mono max-h-[460px] overflow-y-auto">
{data.preview_lines.join('\n')}
          </pre>
        </div>
      </div>
    </div>
  );
}
