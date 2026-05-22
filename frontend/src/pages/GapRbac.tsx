import { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../api';

interface Role { id: number; slug: string; name: string; description?: string; permissions?: string; }
interface Assignment { id: number; user_email: string; role_slug: string; role_name?: string; permissions?: string; granted_at: string; granted_by?: string; }

const BASE = '/gap-nonai-rbac';
const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

export default function GapRbac() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [roleForm, setRoleForm] = useState({ slug: '', name: '', description: '', permissions: '' });
  const [grantForm, setGrantForm] = useState({ user_email: '', role_slug: '' });
  const [effEmail, setEffEmail] = useState('');
  const [effective, setEffective] = useState<{ roles: Role[]; permissions: string[] } | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const r = await apiFetch(`${BASE}/roles`);
      const a = await apiFetch(`${BASE}/assignments`);
      setRoles(r.roles || []);
      setAssignments(a.assignments || []);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const createRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`${BASE}/roles`, { method: 'POST', body: JSON.stringify(roleForm) });
      setRoleForm({ slug: '', name: '', description: '', permissions: '' });
      load();
    } catch (err) { setError((err as Error).message); }
  };
  const deleteRole = async (slug: string) => {
    if (!confirm(`Delete role ${slug}?`)) return;
    try { await apiFetch(`${BASE}/roles/${slug}`, { method: 'DELETE' }); load(); }
    catch (err) { setError((err as Error).message); }
  };
  const grant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`${BASE}/assignments`, { method: 'POST', body: JSON.stringify(grantForm) });
      setGrantForm({ user_email: '', role_slug: '' });
      load();
    } catch (err) { setError((err as Error).message); }
  };
  const revoke = async (id: number) => {
    try { await apiFetch(`${BASE}/assignments/${id}`, { method: 'DELETE' }); load(); }
    catch (err) { setError((err as Error).message); }
  };
  const lookupEffective = async () => {
    if (!effEmail) return;
    try { setEffective(await apiFetch(`${BASE}/effective/${encodeURIComponent(effEmail)}`)); }
    catch (err) { setError((err as Error).message); }
  };

  return (
    <div className="p-6 overflow-auto h-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-white" /></div>
        <div><h1 className="text-2xl font-bold text-white">Role-Based Access Control</h1><p className="text-gray-400 text-sm">{roles.length} roles | {assignments.length} assignments</p></div>
      </div>
      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-white font-bold mb-3 flex items-center gap-2"><Plus className="w-4 h-4" />Create / Update Role</h2>
          <form onSubmit={createRole} className="space-y-2">
            <input className={inp} placeholder="slug (e.g. analyst)" value={roleForm.slug} onChange={e=>setRoleForm({...roleForm,slug:e.target.value})} required />
            <input className={inp} placeholder="display name" value={roleForm.name} onChange={e=>setRoleForm({...roleForm,name:e.target.value})} required />
            <input className={inp} placeholder="description" value={roleForm.description} onChange={e=>setRoleForm({...roleForm,description:e.target.value})} />
            <input className={inp} placeholder="permissions (comma-separated: read,write,admin)" value={roleForm.permissions} onChange={e=>setRoleForm({...roleForm,permissions:e.target.value})} />
            <button className="bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm">Save Role</button>
          </form>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-white font-bold mb-3 flex items-center gap-2"><Plus className="w-4 h-4" />Grant Role to User</h2>
          <form onSubmit={grant} className="space-y-2">
            <input className={inp} placeholder="user_email" value={grantForm.user_email} onChange={e=>setGrantForm({...grantForm,user_email:e.target.value})} required />
            <select className={inp} value={grantForm.role_slug} onChange={e=>setGrantForm({...grantForm,role_slug:e.target.value})} required>
              <option value="">-- pick role --</option>
              {roles.map(r => <option key={r.slug} value={r.slug}>{r.slug}</option>)}
            </select>
            <button className="bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm">Grant</button>
          </form>
          <div className="mt-4 pt-4 border-t border-gray-800">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Effective permissions lookup</h3>
            <div className="flex gap-2">
              <input className={inp} placeholder="user_email" value={effEmail} onChange={e=>setEffEmail(e.target.value)} />
              <button onClick={lookupEffective} className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm">Lookup</button>
            </div>
            {effective && (
              <div className="mt-3 text-xs text-gray-400">
                <div>Roles: {effective.roles.map(r=>r.slug).join(', ') || '(none)'}</div>
                <div>Permissions: <span className="text-teal-400">{effective.permissions.join(', ') || '(none)'}</span></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-white font-bold mb-3">Roles</h2>
          {loading ? <p className="text-gray-500 text-sm">Loading...</p> :
            roles.length === 0 ? <p className="text-gray-500 text-sm">No roles yet.</p> :
            <ul className="divide-y divide-gray-800">
              {roles.map(r => (
                <li key={r.id} className="py-2 flex items-center justify-between">
                  <div><div className="text-sm text-white font-medium">{r.name} <span className="text-gray-500">({r.slug})</span></div><div className="text-xs text-gray-400">{r.permissions}</div></div>
                  <button onClick={()=>deleteRole(r.slug)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                </li>
              ))}
            </ul>}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-white font-bold mb-3">Assignments</h2>
          {assignments.length === 0 ? <p className="text-gray-500 text-sm">No assignments.</p> :
            <ul className="divide-y divide-gray-800">
              {assignments.map(a => (
                <li key={a.id} className="py-2 flex items-center justify-between">
                  <div><div className="text-sm text-white">{a.user_email} <span className="text-teal-400">→ {a.role_slug}</span></div><div className="text-xs text-gray-500">{new Date(a.granted_at).toLocaleString()}{a.granted_by ? ` by ${a.granted_by}` : ''}</div></div>
                  <button onClick={()=>revoke(a.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                </li>
              ))}
            </ul>}
        </div>
      </div>
    </div>
  );
}
