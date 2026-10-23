'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck, ExternalLink, Flame, Loader2, MapPin, Phone, PhoneCall, Plus, Star, Trash2, X } from 'lucide-react';
import { CALL_OUTCOMES, COLDCALL_STATUSES } from '@/lib/coldcall-shared';
import { CopyButton } from '../components/NewOnboardingModal';

// Website cold-call leads: businesses with no real website, found and researched by Claude and
// pushed in through the API (add_coldcall_leads). Pick a lead, call, log what happened.

interface HistoryItem {
  id: string;
  type: string;
  outcome: string;
  note: string;
  status: string;
  createdAt: string;
  createdBy: string;
}

interface Lead {
  id: string;
  name: string;
  category: string;
  group: string;
  address: string;
  phone: string;
  rating: number;
  reviews: number;
  googleUrl: string;
  tier: string;
  gap: string;
  websiteHost: string;
  hook: string;
  activity: string;
  activityNote: string;
  checked: string;
  contactName: string;
  contactRole: string;
  contactSource: string;
  contactConfidence: string;
  dm: string;
  dm2: string;
  status: string;
  notes: string;
  order: number;
  instagramUrl?: string;
  facebookUrl?: string;
  gbpClaimed?: boolean;
  lastReviewDays?: number;
  source?: string;
  followUp?: string;
  contactId?: string;
  attempts: number;
  lastContactedAt?: string;
  history?: HistoryItem[];
}

interface Stats {
  byStatus: Record<string, number>;
  byTier: Record<string, number>;
  followUpsDue: number;
}

const STATUS_STYLE: Record<string, string> = {
  'To contact': 'bg-gray-700/60 text-gray-200',
  'No answer': 'bg-amber-500/15 text-amber-300',
  'Left voicemail': 'bg-amber-500/15 text-amber-300',
  'Call back': 'bg-sky-500/15 text-sky-300',
  Messaged: 'bg-violet-500/15 text-violet-300',
  Replied: 'bg-fuchsia-500/15 text-fuchsia-300',
  Interested: 'bg-[#F46325]/20 text-[#FF9A66]',
  'Appointment set': 'bg-emerald-500/15 text-emerald-300',
  Won: 'bg-emerald-500/25 text-emerald-200',
  'Not a fit': 'bg-red-500/10 text-red-300/80',
};

const input =
  'w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-white placeholder:text-gray-500 focus:border-[#F46325] focus:outline-none';
const chip = (on: boolean) =>
  `rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${on ? 'bg-[#F46325] text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`;

const today = () => new Date().toISOString().slice(0, 10);

function when(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function LeadStatus({ status }: { status: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLE[status] ?? 'bg-gray-700/60 text-gray-300'}`}>
      {status || 'To contact'}
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  if (!tier) return null;
  const hot = tier.toLowerCase() === 'hot';
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold ${
        hot ? 'border-[#F46325]/60 bg-[#F46325]/10 text-[#FF9A66]' : 'border-gray-600 text-gray-300'
      }`}
    >
      {hot && <Flame className="h-3 w-3" />}
      {tier}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  if (children === '' || children == null) return null;
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <div className="mt-0.5 text-sm text-gray-200">{children}</div>
    </div>
  );
}

const EMPTY_NEW = { name: '', phone: '', category: '', address: '', googleUrl: '', tier: 'Warm', gap: '', hook: '' };

export default function ColdcallPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('open');
  const [tier, setTier] = useState('all');
  const [group, setGroup] = useState('all');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/coldcall-leads', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setLeads(data.data ?? []);
      setStats(data.stats ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const groups = useMemo(() => [...new Set(leads.map((l) => l.group).filter(Boolean))], [leads]);
  const tiers = useMemo(() => [...new Set(leads.map((l) => l.tier).filter(Boolean))], [leads]);
  const statuses = useMemo(() => [...new Set([...COLDCALL_STATUSES, ...leads.map((l) => l.status).filter(Boolean)])], [leads]);

  const q = search.trim().toLowerCase();
  const due = (l: Lead) => Boolean(l.followUp && l.followUp <= today());
  const visible = leads.filter(
    (l) =>
      (status === 'all' ||
        (status === 'open' && !['Not a fit', 'Won', 'Appointment set'].includes(l.status)) ||
        (status === 'due' && due(l)) ||
        l.status === status) &&
      (tier === 'all' || l.tier === tier) &&
      (group === 'all' || l.group === group) &&
      (!q || [l.name, l.category, l.phone, l.address, l.contactName, l.notes, l.gap].some((v) => v?.toLowerCase().includes(q)))
  );

  const count = (s: string) => stats?.byStatus[s] ?? 0;
  const openCount = leads.filter((l) => !['Not a fit', 'Won', 'Appointment set'].includes(l.status)).length;
  const called = leads.filter((l) => l.attempts > 0).length;
  const positive = count('Interested') + count('Appointment set') + count('Won') + count('Replied');

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-4xl font-black">
            <PhoneCall className="h-8 w-8 text-[#F46325]" /> Website cold calls
          </h1>
          <p className="mt-1 max-w-2xl text-gray-400">
            Businesses with no real website, researched by Claude. Open one, call, and log what happened. Claude adds new leads through the API.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-4 py-2.5 text-sm font-bold text-gray-200 hover:border-[#F46325] hover:text-white"
        >
          <Plus className="h-4 w-4" /> Add lead
        </button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ['Leads', leads.length],
          ['Still open', openCount],
          ['Called / messaged', called],
          ['Warm replies', positive],
        ].map(([label, n]) => (
          <div key={label} className="rounded-lg border border-gray-700 bg-gray-900 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</p>
            <p className="mt-2 text-3xl font-black">{n}</p>
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setStatus('open')} className={chip(status === 'open')}>
          Open <span className="opacity-70">{openCount}</span>
        </button>
        {(stats?.followUpsDue ?? 0) > 0 && (
          <button type="button" onClick={() => setStatus('due')} className={chip(status === 'due')}>
            Call backs due <span className="opacity-70">{stats?.followUpsDue}</span>
          </button>
        )}
        <button type="button" onClick={() => setStatus('all')} className={chip(status === 'all')}>
          All <span className="opacity-70">{leads.length}</span>
        </button>
        {statuses
          .filter((s) => count(s) > 0)
          .map((s) => (
            <button key={s} type="button" onClick={() => setStatus(s)} className={chip(status === s)}>
              {s} <span className="opacity-70">{count(s)}</span>
            </button>
          ))}
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {tiers.length > 1 && (
          <select value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Tier" className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-[#F46325] focus:outline-none">
            <option value="all">Any tier</option>
            {tiers.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        )}
        {groups.length > 1 && (
          <select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Group" className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-[#F46325] focus:outline-none">
            <option value="all">Every group</option>
            {groups.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        )}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone, notes…"
          className="ml-auto w-64 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#F46325] focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-700 text-xs uppercase tracking-wider text-gray-400">
            <tr>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Why</th>
              <th className="px-4 py-3">Google</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last touch</th>
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
                  {leads.length === 0 ? 'No leads yet. Ask Claude to add them with add_coldcall_leads.' : 'Nothing matches.'}
                </td>
              </tr>
            ) : (
              visible.map((l) => (
                <tr key={l.id} onClick={() => setOpenId(l.id)} className="cursor-pointer border-b border-gray-800 last:border-0 hover:bg-gray-800/60">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <span className="font-bold text-white">{l.name}</span>
                      <TierBadge tier={l.tier} />
                    </span>
                    <span className="block text-xs text-gray-400">
                      {l.category}
                      {l.contactName && ` · ${l.contactName}${l.contactRole ? ` (${l.contactRole})` : ''}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {l.phone ? (
                      <a href={`tel:${l.phone.replace(/[^\d+]/g, '')}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 whitespace-nowrap font-semibold text-white hover:text-[#F46325]">
                        <Phone className="h-3.5 w-3.5" /> {l.phone}
                      </a>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-gray-300">{l.gap}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-300">
                    {l.rating > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {l.rating} <span className="text-gray-500">({l.reviews})</span>
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                    {l.activity && <span className="block text-xs text-gray-500">{l.activity}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <LeadStatus status={l.status} />
                    {l.followUp && <span className={`block pt-1 text-xs ${due(l) ? 'font-bold text-sky-300' : 'text-gray-500'}`}>Call back {l.followUp}</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-400">
                    {l.lastContactedAt ? when(l.lastContactedAt) : <span className="text-gray-600">Never</span>}
                    {l.attempts > 0 && <span className="block text-xs text-gray-500">{l.attempts} tries</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {openId && <LeadDrawer id={openId} statuses={statuses} onClose={() => setOpenId(null)} onChange={load} />}
      {adding && <AddLeadModal onClose={() => setAdding(false)} onAdded={(id) => (setAdding(false), load(), setOpenId(id))} />}
    </div>
  );
}

function LeadDrawer({ id, statuses, onClose, onChange }: { id: string; statuses: string[]; onClose: () => void; onChange: () => void }) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [outcome, setOutcome] = useState('');
  const [note, setNote] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [appointmentUrl, setAppointmentUrl] = useState('');

  const show = (l: Lead) => {
    setLead(l);
    setNotes(l.notes ?? '');
  };

  useEffect(() => {
    fetch(`/api/admin/coldcall-leads/${id}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then(show)
      .catch(() => setError('Could not load this lead'));
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function send(label: string, url: string, method: string, body?: unknown) {
    setBusy(label);
    setError('');
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      onChange();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      return null;
    } finally {
      setBusy('');
    }
  }

  async function logIt() {
    const data = await send('log', `/api/admin/coldcall-leads/${id}/log`, 'POST', { outcome, note, followUp });
    if (data) {
      show(data);
      setOutcome('');
      setNote('');
      setFollowUp('');
    }
  }

  async function patch(fields: Record<string, unknown>) {
    const data = await send('save', `/api/admin/coldcall-leads/${id}`, 'PATCH', fields);
    if (data) show(data);
  }

  async function makeAppointment() {
    const data = await send('appt', `/api/admin/coldcall-leads/${id}/appointment`, 'POST');
    if (data) {
      show(data.lead);
      setAppointmentUrl(data.appointment.url);
    }
  }

  async function remove() {
    if (!lead || !window.confirm(`Delete ${lead.name} and its call history? Setting it to "Not a fit" keeps the record.`)) return;
    if (await send('delete', `/api/admin/coldcall-leads/${id}`, 'DELETE')) onClose();
  }

  return (
    <div className="fixed inset-0 z-40">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col overflow-y-auto border-l border-gray-800 bg-gray-950">
        {!lead ? (
          <div className="flex flex-1 items-center justify-center text-gray-500">{error || <Loader2 className="h-6 w-6 animate-spin" />}</div>
        ) : (
          <>
            <div className="sticky top-0 z-10 border-b border-gray-800 bg-gray-950 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-black">{lead.name}</h2>
                    <TierBadge tier={lead.tier} />
                    <LeadStatus status={lead.status} />
                  </div>
                  <p className="mt-1 text-sm text-gray-400">
                    {[lead.category, lead.group].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#F46325] px-4 py-2.5 font-bold text-white hover:bg-[#FF7B42]"
                  >
                    <Phone className="h-4 w-4" /> {lead.phone}
                  </a>
                )}
                {lead.phone && <CopyButton text={lead.phone} label="Copy number" />}
                {[
                  ['Google', lead.googleUrl],
                  ['Instagram', lead.instagramUrl],
                  ['Facebook', lead.facebookUrl],
                ]
                  .filter(([, url]) => url)
                  .map(([label, url]) => (
                    <a key={label} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-gray-700 px-2.5 py-1.5 text-xs font-semibold text-gray-300 hover:border-[#F46325] hover:text-white">
                      <ExternalLink className="h-3.5 w-3.5" /> {label}
                    </a>
                  ))}
              </div>
            </div>

            <div className="space-y-6 px-6 py-6">
              {/* Log a call */}
              <section className="rounded-lg border border-[#F46325]/40 bg-[#F46325]/5 p-4">
                <p className="mb-3 text-sm font-bold uppercase tracking-wider text-[#FF9A66]">What happened?</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(CALL_OUTCOMES).map((o) => (
                    <button key={o} type="button" onClick={() => setOutcome(outcome === o ? '' : o)} className={chip(outcome === o)}>
                      {o}
                    </button>
                  ))}
                </div>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="What they said, who picked up, best time to call…" className={`${input} mt-3 text-sm`} />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    Call back on
                    <input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} className="rounded-lg border border-gray-700 bg-gray-900 px-2 py-1.5 text-white focus:border-[#F46325] focus:outline-none" />
                  </label>
                  <button
                    type="button"
                    disabled={(!outcome && !note.trim()) || busy === 'log'}
                    onClick={logIt}
                    className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[#F46325] px-4 py-2 text-sm font-bold text-white hover:bg-[#FF7B42] disabled:opacity-40"
                  >
                    {busy === 'log' && <Loader2 className="h-4 w-4 animate-spin" />} Log it
                  </button>
                </div>
                {outcome && <p className="mt-2 text-xs text-gray-400">Moves the lead to “{CALL_OUTCOMES[outcome]}”.</p>}
              </section>

              {error && <p className="text-sm text-red-400">{error}</p>}

              {/* Pitch */}
              <section className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Why they’re a good prospect">{lead.hook}</Field>
                </div>
                <Field label="Gap">{lead.gap}</Field>
                <Field label="Website link on Google">{lead.websiteHost}</Field>
                <Field label="Talk to">
                  {lead.contactName ? (
                    <>
                      <span className="font-semibold text-white">{lead.contactName}</span>
                      {lead.contactRole && `, ${lead.contactRole}`}
                      {lead.contactConfidence && <span className="text-gray-500"> · {lead.contactConfidence}</span>}
                      {lead.contactSource && <span className="block text-xs text-gray-500">{lead.contactSource}</span>}
                    </>
                  ) : (
                    <span className="text-gray-500">Name not found{lead.contactConfidence ? ` (${lead.contactConfidence})` : ''}</span>
                  )}
                </Field>
                <Field label="Google">
                  {lead.rating > 0 ? `★ ${lead.rating} · ${lead.reviews} reviews` : 'No rating'}
                  {lead.gbpClaimed !== undefined && <span className="text-gray-500"> · {lead.gbpClaimed ? 'Claimed' : 'Unclaimed'}</span>}
                </Field>
                <Field label="Activity">
                  {lead.activity}
                  {lead.lastReviewDays !== undefined && <span className="text-gray-500"> · last review {lead.lastReviewDays} days ago</span>}
                  {lead.activityNote && <span className="block text-xs text-gray-500">{lead.activityNote}</span>}
                </Field>
                <Field label="Address">
                  <span className="inline-flex items-start gap-1.5">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-500" /> {lead.address}
                  </span>
                </Field>
                <Field label="Researched">{[lead.checked, lead.source].filter(Boolean).join(' · ')}</Field>
              </section>

              {/* Messages */}
              {[
                ['Message 1', lead.dm],
                ['Message 2', lead.dm2],
              ]
                .filter(([, text]) => text)
                .map(([label, text]) => (
                  <section key={label}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
                      <CopyButton text={text} label="Copy" />
                    </div>
                    <p className="whitespace-pre-wrap rounded-lg border border-gray-800 bg-gray-900 p-3 text-sm text-gray-200">{text}</p>
                  </section>
                ))}

              {/* Tracking */}
              <section className="grid gap-4 rounded-lg border border-gray-800 bg-gray-900 p-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Status</span>
                  <select value={lead.status} onChange={(e) => patch({ status: e.target.value })} className={input}>
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Call back on</span>
                  <input type="date" value={lead.followUp ?? ''} onChange={(e) => patch({ followUp: e.target.value })} className={input} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Notes</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={() => notes !== (lead.notes ?? '') && patch({ notes })}
                    rows={3}
                    className={`${input} text-sm`}
                    placeholder="Anything to remember about this business"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                  <button
                    type="button"
                    onClick={makeAppointment}
                    disabled={busy === 'appt'}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-3.5 py-2 text-sm font-bold text-gray-200 hover:border-[#F46325] hover:text-white disabled:opacity-50"
                  >
                    {busy === 'appt' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />} Make appointment link
                  </button>
                  {lead.contactId && (
                    <Link href={`/admin/contacts/${lead.contactId}`} className="text-sm font-semibold text-gray-400 underline hover:text-white">
                      Open contact
                    </Link>
                  )}
                  <button type="button" onClick={remove} className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
                {appointmentUrl && (
                  <div className="sm:col-span-2">
                    <p className="break-all rounded-md bg-gray-950 px-3 py-2 font-mono text-sm text-white">{appointmentUrl}</p>
                    <div className="mt-2">
                      <CopyButton text={appointmentUrl} />
                    </div>
                  </div>
                )}
              </section>

              {/* History */}
              <section>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  History {lead.attempts > 0 && <span className="normal-case tracking-normal text-gray-600">· {lead.attempts} calls / DMs</span>}
                </p>
                {lead.history?.length ? (
                  <ol className="space-y-3 border-l border-gray-800 pl-4">
                    {lead.history.map((h) => (
                      <li key={h.id} className="relative">
                        <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-gray-700" />
                        <p className="text-sm text-gray-200">
                          <span className="font-semibold text-white">{h.outcome || (h.type === 'status' ? `Status → ${h.status}` : h.type === 'added' ? 'Added' : 'Note')}</span>
                          {h.note && <span className="text-gray-300"> · {h.note}</span>}
                        </p>
                        <p className="text-xs text-gray-500">
                          {when(h.createdAt)}
                          {h.createdBy && ` · ${h.createdBy}`}
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-gray-500">Nothing yet.</p>
                )}
              </section>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function AddLeadModal({ onClose, onAdded }: { onClose: () => void; onAdded: (id: string) => void }) {
  const [form, setForm] = useState(EMPTY_NEW);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k: keyof typeof EMPTY_NEW) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/coldcall-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, checked: new Date().toISOString().slice(0, 10) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not add the lead');
      const first = data.results?.[0];
      if (!first?.id) throw new Error(first?.error || 'Could not add the lead');
      onAdded(first.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the lead');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <form onSubmit={save} className="relative w-full max-w-lg space-y-4 rounded-lg border border-gray-700 bg-gray-900 p-6">
        <div className="flex items-center justify-between">
          <p className="text-lg font-black">Add a cold-call lead</p>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={input} placeholder="Business name *" value={form.name} onChange={set('name')} required />
          <input className={input} placeholder="Phone" value={form.phone} onChange={set('phone')} />
          <input className={input} placeholder="Category, e.g. Barber shop" value={form.category} onChange={set('category')} />
          <select className={input} value={form.tier} onChange={set('tier')}>
            <option>Hot</option>
            <option>Warm</option>
          </select>
          <input className={`${input} sm:col-span-2`} placeholder="Address" value={form.address} onChange={set('address')} />
          <input className={`${input} sm:col-span-2`} placeholder="Google Maps link" value={form.googleUrl} onChange={set('googleUrl')} />
          <input className={`${input} sm:col-span-2`} placeholder="Gap, e.g. No website on Google" value={form.gap} onChange={set('gap')} />
          <textarea className={`${input} sm:col-span-2`} rows={2} placeholder="Why they're a good prospect" value={form.hook} onChange={set('hook')} />
        </div>
        <p className="text-xs text-gray-500">Same phone number as a lead already here updates that lead instead.</p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#F46325] px-5 py-2.5 font-bold text-white hover:bg-[#FF7B42] disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add lead
        </button>
      </form>
    </div>
  );
}
