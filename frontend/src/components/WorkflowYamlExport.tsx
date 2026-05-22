import { useState } from 'react';
import { FileDown, Copy, Check } from 'lucide-react';

type Props = {
  yaml: string;
  workflow_count: number;
  total_steps: number;
  filename: string;
};

export default function WorkflowYamlExport({ yaml, workflow_count, total_steps, filename }: Props) {
  const [copied, setCopied] = useState(false);

  function download() {
    const blob = new Blob([yaml], { type: 'application/x-yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(yaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4" data-testid="workflow-yaml-export">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-white font-semibold">Workflow YAML Export</div>
          <div className="text-xs text-gray-400">
            {workflow_count} workflows · {total_steps} steps · drop into Git-tracked ops repo
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={copy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy YAML'}
          </button>
          <button onClick={download}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-teal-600 hover:bg-teal-500 text-white">
            <FileDown className="w-3.5 h-3.5" />
            Download {filename}
          </button>
        </div>
      </div>
      <pre className="text-[11px] leading-relaxed text-emerald-200 bg-gray-950/70 border border-gray-800 rounded-lg p-3 max-h-[420px] overflow-auto whitespace-pre">
{yaml}
      </pre>
    </div>
  );
}
