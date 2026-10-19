'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Users } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'setter';
  active: boolean;
  created_at: string;
}

const input =
  'w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-white placeholder:text-gray-500 focus:border-[#F46325] focus:outline-none';

export default function TeamPage() {
  const [team, setTeam] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'setter' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/team', { cache: 'no-store' });
      if (res.ok) setTeam((await res.json()).data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await fetch('/api/admin/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error || 'Could not add them');
    setForm({ name: '', username: '', password: '', role: 'setter' });
    load();
  }

  async function patch(id: string, changes: Record<string, unknown>) {
    const res = await fetch('/api/admin/team', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...changes }) });
    if (!res.ok) window.alert((await res.json()).error || 'Could not save');
    load();
  }

  function resetPassword(m: Member) {
    const password = window.prompt(`New password for ${m.name} (at least 8 characters):`);
    if (password) patch(m.id, { password });
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-4xl font-black">
          <Users className="h-8 w-8 text-[#F46325]" /> Team
        </h1>
        <p className="mt-1 max-w-2xl text-gray-400">
          Logins for your team. Setters can only make appointment links and see their own. Admins see the whole CRM.
        </p>
      </div>

      <form onSubmit={add} className="mb-8 grid gap-4 rounded-lg border border-gray-700 bg-gray-900 p-5 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-300">Name</span>
          <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-300">Username</span>
          <input className={input} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="off" required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-300">Password</span>
          <input className={input} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" minLength={8} required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-300">Role</span>
          <select className={input} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="setter">Appointment setter</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#F46325] px-5 py-2.5 font-bold text-white hover:bg-[#FF7B42] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />} Add
        </button>
        {error && <p className="text-sm text-red-400 sm:col-span-2 lg:col-span-5">{error}</p>}
      </form>

      <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-700 text-xs uppercase tracking-wider text-gray-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : team.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  No team logins yet. Add your first setter above.
                </td>
              </tr>
            ) : (
              team.map((m) => (
                <tr key={m.id} className={`border-b border-gray-800 last:border-0 ${m.active ? '' : 'opacity-50'}`}>
                  <td className="px-4 py-3 font-bold">{m.name}</td>
                  <td className="px-4 py-3 font-mono text-gray-300">{m.username}</td>
                  <td className="px-4 py-3">
                    <select
                      value={m.role}
                      onChange={(e) => patch(m.id, { role: e.target.value })}
                      className="rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-sm"
                      aria-label="Role"
                    >
                      <option value="setter">Setter</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">{m.active ? <span className="text-emerald-300">Active</span> : <span className="text-gray-400">Off</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3 text-xs font-semibold">
                      <button type="button" onClick={() => resetPassword(m)} className="text-gray-300 hover:text-white">
                        Reset password
                      </button>
                      <button type="button" onClick={() => patch(m.id, { active: !m.active })} className={m.active ? 'text-red-300 hover:text-red-200' : 'text-emerald-300'}>
                        {m.active ? 'Turn off' : 'Turn on'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
