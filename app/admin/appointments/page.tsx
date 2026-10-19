'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, ExternalLink, Eye, EyeOff, Loader2, Plus, Trash2 } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { CopyButton } from '../components/NewOnboardingModal';

// Appointment setters make a link per prospect here: name + business (social / Google Business
// optional). The link opens a page made for that business where they book the closer's Calendly.

interface Appointment {
  id: string;
  contact_id: string | null;
  client_name: string;
  business_name: string;
  social_url: string;
  gbp_url: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  opened_at: string | null;
  last_opened_at: string | null;
  open_count: number;
  booked_at: string | null;
  call_start: string | null;
  invitee_email: string;
  canceled_at: string | null;
  status: string;
  url: string;
}

const STATUS_FILTERS = ['all', 'sent', 'opened', 'booked', 'canceled'] as const;
const STATUS_TEXT: Record<string, string> = { all: 'All', sent: 'Not opened', opened: 'Opened', booked: 'Booked', canceled: 'Canceled' };

const input =
  'w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-white placeholder:text-gray-500 focus:border-[#F46325] focus:outline-none';

function when(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function AppointmentsPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [role, setRole] = useState<'admin' | 'setter'>('setter');
  const [calendly, setCalendly] = useState<{ token: boolean; eventUrl: boolean; webhookKey: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [setBy, setSetBy] = useState('all');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({ clientName: '', businessName: '', socialUrl: '', gbpUrl: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [made, setMade] = useState<Appointment | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/appointments', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.data ?? []);
      setRole(data.role === 'admin' ? 'admin' : 'setter');
      setCalendly(data.calendly ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not make the link');
      setMade(data);
      setForm({ clientName: '', businessName: '', socialUrl: '', gbpUrl: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not make the link');
    } finally {
      setSaving(false);
    }
  }

  async function remove(a: Appointment) {
    if (!window.confirm(`Delete the link for ${a.business_name}? The contact stays in the CRM.`)) return;
    await fetch(`/api/admin/appointments/${a.id}`, { method: 'DELETE' });
    load();
  }

  const setters = Array.from(new Map(items.map((i) => [i.created_by, i.created_by_name])).entries());
  const q = search.trim().toLowerCase();
  const visible = items.filter(
    (i) =>
      (filter === 'all' || i.status === filter) &&
      (setBy === 'all' || i.created_by === setBy) &&
      (!q || [i.client_name, i.business_name, i.created_by_name].some((v) => v?.toLowerCase().includes(q)))
  );
  const pool = items.filter((i) => setBy === 'all' || i.created_by === setBy);
  const opened = pool.filter((i) => i.opened_at).length;
  const booked = pool.filter((i) => i.status === 'booked').length;
  const calendlyMissing = calendly && !(calendly.token && calendly.eventUrl && calendly.webhookKey);

  return (
    <div>
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-4xl font-black">
          <CalendarCheck className="h-8 w-8 text-[#F46325]" /> Appointments
        </h1>
        <p className="mt-1 max-w-2xl text-gray-400">
          Make a link for a prospect, send it to them, and they book a video call with the closer. You can see when they open it and when they book.
        </p>
      </div>

      {role === 'admin' && calendlyMissing && (
        <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          Calendly isn&apos;t fully connected. Missing:{' '}
          {[!calendly.token && 'CALENDLY_TOKEN', !calendly.eventUrl && 'CALENDLY_EVENT_URL', !calendly.webhookKey && 'CALENDLY_WEBHOOK_SIGNING_KEY']
            .filter(Boolean)
            .join(', ')}
          . Add them to the environment, then run <code className="text-white">node scripts/calendly-webhook.mjs</code> once.
        </div>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={create} className="space-y-4 rounded-lg border border-gray-700 bg-gray-900 p-5">
          <p className="text-sm font-bold uppercase tracking-wider text-gray-400">New appointment link</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-300">Their name *</span>
              <input className={input} value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Maria Lopez" required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-300">Business *</span>
              <input className={input} value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="Lopez Auto Repair" required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-300">Social link</span>
              <input className={input} value={form.socialUrl} onChange={(e) => setForm({ ...form, socialUrl: e.target.value })} placeholder="instagram.com/…" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-gray-300">Google Business link</span>
              <input className={input} value={form.gbpUrl} onChange={(e) => setForm({ ...form, gbpUrl: e.target.value })} placeholder="maps.app.goo.gl/…" />
            </label>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#F46325] px-5 py-3 font-bold text-white hover:bg-[#FF7B42] disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />} Make link
          </button>
        </form>

        <div className="flex flex-col gap-4">
          {made ? (
            <div className="rounded-lg border border-[#F46325]/60 bg-[#F46325]/10 p-5">
              <p className="text-sm font-bold uppercase tracking-wider text-[#FF9A66]">Link ready for {made.business_name}</p>
              <p className="mt-3 break-all rounded-md bg-gray-950 px-3 py-2 font-mono text-sm text-white">{made.url}</p>
              <div className="mt-3 flex items-center gap-3">
                <CopyButton text={made.url} />
                <a href={made.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white">
                  <ExternalLink className="h-3.5 w-3.5" /> Preview
                </a>
              </div>
              <p className="mt-3 text-xs text-gray-400">Opening it while you&apos;re logged in here doesn&apos;t count as an open.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {[
                ['Links', pool.length],
                ['Opened', opened],
                ['Booked', booked],
              ].map(([label, n]) => (
                <div key={label} className="rounded-lg border border-gray-700 bg-gray-900 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
                  <p className="mt-2 text-3xl font-black">{n}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((s) => {
          const count = s === 'all' ? pool.length : pool.filter((i) => i.status === s).length;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                filter === s ? 'bg-[#F46325] text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {STATUS_TEXT[s]} <span className="opacity-70">{count}</span>
            </button>
          );
        })}
        {role === 'admin' && setters.length > 1 && (
          <select
            value={setBy}
            onChange={(e) => setSetBy(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-[#F46325] focus:outline-none"
            aria-label="Set by"
          >
            <option value="all">Everyone</option>
            {setters.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        )}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="ml-auto w-56 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#F46325] focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-700 text-xs uppercase tracking-wider text-gray-400">
            <tr>
              <th className="px-4 py-3">Prospect</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Made</th>
              <th className="px-4 py-3">Opened</th>
              <th className="px-4 py-3">Call</th>
              <th className="px-4 py-3">Link</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  {items.length === 0 ? 'No links yet. Make your first one above.' : 'Nothing matches.'}
                </td>
              </tr>
            ) : (
              visible.map((a) => (
                <tr key={a.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/60">
                  <td className="px-4 py-3">
                    {role === 'admin' && a.contact_id ? (
                      <Link href={`/admin/contacts/${a.contact_id}`} className="font-bold text-white hover:text-[#F46325]">
                        {a.business_name}
                      </Link>
                    ) : (
                      <span className="font-bold text-white">{a.business_name}</span>
                    )}
                    <span className="block text-xs text-gray-400">{a.client_name}</span>
                    {(a.social_url || a.gbp_url) && (
                      <span className="mt-1 flex gap-3 text-xs">
                        {a.social_url && (
                          <a href={a.social_url} target="_blank" rel="noreferrer" className="text-gray-400 underline hover:text-white">
                            Social
                          </a>
                        )}
                        {a.gbp_url && (
                          <a href={a.gbp_url} target="_blank" rel="noreferrer" className="text-gray-400 underline hover:text-white">
                            Google
                          </a>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {when(a.created_at)}
                    {role === 'admin' && <span className="block text-xs text-gray-500">by {a.created_by_name}</span>}
                  </td>
                  <td className="px-4 py-3">
                    {a.opened_at ? (
                      <span className="flex items-center gap-1.5 text-sky-300">
                        <Eye className="h-4 w-4" /> {when(a.opened_at)}
                        {a.open_count > 1 && <span className="text-xs text-gray-500">×{a.open_count}</span>}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <EyeOff className="h-4 w-4" /> Not opened
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {a.status === 'booked' ? (
                      <span className="font-semibold text-emerald-300">{a.call_start ? when(a.call_start) : 'Booked, time coming'}</span>
                    ) : a.status === 'canceled' ? (
                      <span className="text-red-300">Canceled {when(a.canceled_at)}</span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                    {a.invitee_email && <span className="block text-xs text-gray-400">{a.invitee_email}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CopyButton text={a.url} />
                      <a href={a.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white" aria-label="Open link">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      {role === 'admin' && (
                        <button type="button" onClick={() => remove(a)} className="text-gray-500 hover:text-red-400" aria-label="Delete link">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
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
