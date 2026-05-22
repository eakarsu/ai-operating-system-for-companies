import { useState } from 'react';
import { Bot, Save, RefreshCw } from 'lucide-react';
import { apiFetch } from '../api';

export type AgentRow = {
  id: number;
  slug: string;
  name: string;
  role: string | null;
  department: string | null;
  model: string | null;
  tool_slugs: string | null;
  system_prompt: string | null;
  cost_per_1k_tokens_cents: string | null;
  success_rate_pct: string | null;
  avg_latency_ms: number | null;
  active: boolean;
  run_count: number;
  run_success: number;
};

type Props = {
  agents: AgentRow[];
  totals: { total: number; active: number; runs: number };
  onSaved: () => void;
};

export default function AgentRegistryEditor({ agents, totals, onSaved }: Props) {
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Partial<AgentRow>>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  function startEdit(a: AgentRow) {
    setEditId(a.id);
    setDraft({
      name: a.name, role: a.role || '', department: a.department || '',
      model: a.model || '', tool_slugs: a.tool_slugs || '',
      system_prompt: a.system_prompt || '', active: a.active
    });
    setMsg('');
  }
  async function save(id: number) {
    setSaving(true); setMsg('');
    try {
      await apiFetch(`/custom-views/agent-registry/${id}`, {
        method: 'PUT', body: JSON.stringify(draft)
      });
      setMsg('Saved.');
      setEditId(null);
      onSaved();
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally { setSaving(false); }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4" data-testid="agent-registry-editor">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-300" />
          <div>
            <div className="text-white font-semibold">Agent Registry Editor</div>
            <div className="text-xs text-gray-400">
              {totals.total} agents · {totals.active} active · {totals.runs} runs total
            </div>
          </div>
        </div>
        <button onClick={onSaved}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>
      {msg && <div className="mb-2 text-xs text-teal-300">{msg}</div>}
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-xs">
          <thead className="bg-gray-950 text-gray-400">
            <tr>
              <th className="text-left p-2">Agent</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Dept</th>
              <th className="text-left p-2">Model</th>
              <th className="text-left p-2">Tools</th>
              <th className="text-right p-2">Runs</th>
              <th className="text-left p-2">Active</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {agents.map(a => {
              const editing = editId === a.id;
              return (
                <tr key={a.id} className="border-t border-gray-800 align-top">
                  <td className="p-2">
                    {editing ? (
                      <input className="bg-gray-800 border border-gray-700 rounded px-2 py-1 w-40 text-gray-100"
                        value={draft.name as string || ''} onChange={e => setDraft({ ...draft, name: e.target.value })} />
                    ) : (
                      <div>
                        <div className="text-white">{a.name}</div>
                        <div className="text-gray-500 text-[10px]">{a.slug}</div>
                      </div>
                    )}
                  </td>
                  <td className="p-2 text-gray-300">
                    {editing ? (
                      <input className="bg-gray-800 border border-gray-700 rounded px-2 py-1 w-24 text-gray-100"
                        value={draft.role as string || ''} onChange={e => setDraft({ ...draft, role: e.target.value })} />
                    ) : a.role || '—'}
                  </td>
                  <td className="p-2 text-gray-300">
                    {editing ? (
                      <input className="bg-gray-800 border border-gray-700 rounded px-2 py-1 w-24 text-gray-100"
                        value={draft.department as string || ''} onChange={e => setDraft({ ...draft, department: e.target.value })} />
                    ) : a.department || '—'}
                  </td>
                  <td className="p-2 text-gray-300">
                    {editing ? (
                      <input className="bg-gray-800 border border-gray-700 rounded px-2 py-1 w-44 text-gray-100"
                        value={draft.model as string || ''} onChange={e => setDraft({ ...draft, model: e.target.value })} />
                    ) : <span className="font-mono text-[11px]">{a.model || '—'}</span>}
                  </td>
                  <td className="p-2 text-gray-300">
                    {editing ? (
                      <input className="bg-gray-800 border border-gray-700 rounded px-2 py-1 w-44 text-gray-100"
                        value={draft.tool_slugs as string || ''} onChange={e => setDraft({ ...draft, tool_slugs: e.target.value })} />
                    ) : <span className="font-mono text-[11px]">{a.tool_slugs || '—'}</span>}
                  </td>
                  <td className="p-2 text-right text-gray-300">
                    {a.run_count}
                    <span className="text-emerald-400 ml-1">({a.run_success}ok)</span>
                  </td>
                  <td className="p-2">
                    {editing ? (
                      <input type="checkbox" checked={!!draft.active}
                        onChange={e => setDraft({ ...draft, active: e.target.checked })} />
                    ) : (
                      <span className={a.active ? 'text-emerald-300' : 'text-gray-500'}>{a.active ? 'yes' : 'no'}</span>
                    )}
                  </td>
                  <td className="p-2 text-right whitespace-nowrap">
                    {editing ? (
                      <>
                        <button disabled={saving} onClick={() => save(a.id)}
                          className="px-2 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-[11px] mr-1">
                          <Save className="w-3 h-3 inline mr-0.5" /> Save
                        </button>
                        <button onClick={() => setEditId(null)}
                          className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-300 text-[11px]">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button onClick={() => startEdit(a)}
                        className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-[11px]">
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
