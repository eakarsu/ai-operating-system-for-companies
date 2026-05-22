import { useState } from 'react';
import { Plus, Save, Trash2, ShieldCheck, X } from 'lucide-react';
import { apiFetch } from '../api';

export interface Role {
  id: number;
  slug: string;
  name: string;
  description: string;
  permissions: string[];
}
export interface RolesData {
  roles: Role[];
  permissions_catalog: string[];
  totals: { roles: number };
}

export default function RolePermissionEditor({ data, onChange }: { data: RolesData; onChange: () => void }) {
  const { roles, permissions_catalog } = data;
  const [editing, setEditing] = useState<Record<number, Partial<Role>>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [err, setErr] = useState('');

  // create form
  const [newSlug, setNewSlug] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPerms, setNewPerms] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  function patch(id: number, key: keyof Role, val: any) {
    setEditing(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: val } }));
  }
  function togglePerm(id: number, perm: string, current: string[]) {
    const e = editing[id]?.permissions ?? current;
    const next = e.includes(perm) ? e.filter(p => p !== perm) : [...e, perm];
    patch(id, 'permissions', next);
  }

  async function save(role: Role) {
    setBusyId(role.id); setErr('');
    try {
      const body = { ...role, ...editing[role.id] };
      await apiFetch(`/custom-views/roles/${role.id}`, { method: 'PUT', body: JSON.stringify(body) });
      setEditing(prev => { const n = { ...prev }; delete n[role.id]; return n; });
      onChange();
    } catch (e: any) { setErr(e.message || 'save failed'); }
    finally { setBusyId(null); }
  }
  async function remove(role: Role) {
    if (!confirm(`Delete role "${role.name}"?`)) return;
    setBusyId(role.id); setErr('');
    try {
      await apiFetch(`/custom-views/roles/${role.id}`, { method: 'DELETE' });
      onChange();
    } catch (e: any) { setErr(e.message || 'delete failed'); }
    finally { setBusyId(null); }
  }
  async function create() {
    if (!newSlug.trim() || !newName.trim()) { setErr('slug and name are required'); return; }
    setCreating(true); setErr('');
    try {
      await apiFetch('/custom-views/roles', {
        method: 'POST',
        body: JSON.stringify({ slug: newSlug.trim(), name: newName.trim(), description: newDesc, permissions: newPerms })
      });
      setNewSlug(''); setNewName(''); setNewDesc(''); setNewPerms([]);
      onChange();
    } catch (e: any) { setErr(e.message || 'create failed'); }
    finally { setCreating(false); }
  }

  return (
    <div data-testid="role-permission-editor" className="space-y-5">
      {err && (
        <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-xs">{err}</div>
      )}

      <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <Plus className="w-4 h-4 text-teal-400" />
          <div className="text-sm font-medium text-white">Create New Role</div>
        </div>
        <div className="grid md:grid-cols-3 gap-3 mb-3">
          <input value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="slug (e.g. reviewer)"
            data-testid="new-role-slug"
            className="bg-gray-950 border border-gray-700 rounded px-2 py-1.5 text-sm text-white" />
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Display name"
            data-testid="new-role-name"
            className="bg-gray-950 border border-gray-700 rounded px-2 py-1.5 text-sm text-white" />
          <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description"
            className="bg-gray-950 border border-gray-700 rounded px-2 py-1.5 text-sm text-white" />
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {permissions_catalog.map(p => (
            <button key={p} type="button" onClick={() => setNewPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
              className={`text-[11px] px-2 py-0.5 rounded border ${newPerms.includes(p) ? 'bg-teal-600/20 border-teal-500 text-teal-200' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
              {p}
            </button>
          ))}
        </div>
        <button onClick={create} disabled={creating}
          data-testid="create-role-btn"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium disabled:opacity-50">
          <Plus className="w-3.5 h-3.5" /> {creating ? 'Creating...' : 'Create Role'}
        </button>
      </div>

      <div className="space-y-3">
        {roles.map(role => {
          const e = editing[role.id] || {};
          const perms = (e.permissions as string[] | undefined) ?? role.permissions;
          const dirty = !!editing[role.id];
          return (
            <div key={role.id} className="p-4 rounded-lg bg-gray-900 border border-gray-800">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${dirty ? 'text-amber-400' : 'text-teal-400'}`} />
                  <div>
                    <div className="text-sm font-semibold text-white">
                      <input value={(e.name as string | undefined) ?? role.name}
                        onChange={ev => patch(role.id, 'name', ev.target.value)}
                        className="bg-transparent border-b border-gray-800 focus:border-teal-500 outline-none px-1 text-white text-sm" />
                      <span className="text-[10px] text-gray-500 ml-2">[{role.slug}]</span>
                    </div>
                    <input value={(e.description as string | undefined) ?? role.description}
                      onChange={ev => patch(role.id, 'description', ev.target.value)}
                      className="bg-transparent border-b border-gray-800 focus:border-teal-500 outline-none px-1 mt-1 text-xs text-gray-400 w-96 max-w-full" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => save(role)} disabled={!dirty || busyId === role.id}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs disabled:opacity-40">
                    <Save className="w-3 h-3" /> Save
                  </button>
                  <button onClick={() => remove(role)} disabled={busyId === role.id}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-600/80 hover:bg-red-500 text-white text-xs disabled:opacity-40">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {permissions_catalog.map(p => {
                  const on = perms.includes(p);
                  return (
                    <button key={p} type="button" onClick={() => togglePerm(role.id, p, role.permissions)}
                      className={`text-[11px] px-2 py-0.5 rounded border ${on ? 'bg-teal-600/20 border-teal-500 text-teal-200' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                      {on ? '' : <X className="w-2.5 h-2.5 inline mr-1 opacity-0" />}{p}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {roles.length === 0 && (
          <div className="text-gray-500 text-sm text-center py-6">No roles defined.</div>
        )}
      </div>
    </div>
  );
}
