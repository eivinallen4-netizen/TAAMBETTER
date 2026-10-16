'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { ArrowRight, Columns3, Globe, List, Plus, Search, Send, Share2 } from 'lucide-react';
import type { OnboardingKind } from '@/app/lib/onboarding';
import { StatusBadge } from './StatusBadge';
import { KindBadge, type LinkKind } from './NewOnboardingModal';
import { SendModal } from './SendModal';
import type { MessageType } from '@/app/lib/crm-messages';

type Source = 'video_offer' | 'contact' | 'tool' | 'onboarding';
type LeadSource = Exclude<Source, 'onboarding'>;

interface OverviewItem {
  kind: Source;
  id: string;
  name: string;
  business: string;
  detail: string;
  status: string;
  date: string;
  href: string;
  onboardingKind?: OnboardingKind;
  progress?: number;
}

interface KindCounts {
  total: number;
  waiting: number;
  toReview: number;
  complete: number;
}

interface Overview {
  stats: {
    totalLeads: number;
    leadsThisWeek: number;
    videoOffers: number;
    contacts: number;
    toolLeads: number;
    onboarding: Record<LinkKind, KindCounts>;
  };
  items: OverviewItem[];
}

const SOURCE_LABELS: Record<Source, string> = {
  video_offer: 'Free video',
  contact: 'Contact form',
  tool: 'Free tool',
  onboarding: 'Onboarding',
};

const SOURCE_STYLES: Record<LeadSource, string> = {
  video_offer: 'border-[#F46325]/60 text-[#FF9A66]',
  contact: 'border-sky-500/60 text-sky-300',
  tool: 'border-violet-500/60 text-violet-300',
};

// Pipeline stages, left to right. Leads enter on the left; onboarding links move right as the client fills them out.
const STAGES: { id: string; label: string; hint: string; match: (i: OverviewItem) => boolean; accent?: boolean }[] = [
  { id: 'lead', label: 'New leads', hint: 'Follow up, then send an onboarding link', match: (i) => i.kind !== 'onboarding' },
  { id: 'sent', label: 'Link sent', hint: 'Waiting on the client to start', match: (i) => i.kind === 'onboarding' && (i.status === 'sent' || i.status === 'opened') },
  { id: 'in_progress', label: 'Filling out', hint: 'Client is partway through', match: (i) => i.kind === 'onboarding' && i.status === 'in_progress' },
  { id: 'submitted', label: 'Ready to review', hint: 'Grab what you need, mark complete', match: (i) => i.kind === 'onboarding' && i.status === 'submitted', accent: true },
  { id: 'complete', label: 'Complete', hint: 'Onboarded clients', match: (i) => i.kind === 'onboarding' && i.status === 'complete' },
];

const COLUMN_LIMIT = 25;
const WEEK = 7 * 24 * 60 * 60 * 1000;
const VIEW_KEY = 'taam-admin-view';

type View = 'board' | 'list';
const viewListeners = new Set<() => void>();

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'board';
  } catch {
    return 'board';
  }
}

function writeView(v: View) {
  try {
    localStorage.setItem(VIEW_KEY, v);
  } catch {}
  viewListeners.forEach((l) => l());
}

function subscribeView(listener: () => void) {
  viewListeners.add(listener);
  return () => viewListeners.delete(listener);
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  if (Number.isNaN(diff)) return '';
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(date).toLocaleDateString();
}

function SourceBadge({ item }: { item: OverviewItem }) {
  if (item.kind === 'onboarding') return item.onboardingKind ? <KindBadge kind={item.onboardingKind} /> : null;
  return <span className={`inline-block whitespace-nowrap rounded border px-2 py-0.5 text-xs font-bold ${SOURCE_STYLES[item.kind]}`}>{SOURCE_LABELS[item.kind]}</span>;
}

function Kpi({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'border-[#F46325]/60 bg-[#F46325]/10' : 'border-gray-800 bg-gray-900'}`}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-black ${accent ? 'text-[#F46325]' : 'text-white'}`}>{value}</p>
      {sub && <p className="mt-0.5 truncate text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

function PipelineCard({ item, isNew }: { item: OverviewItem; isNew: boolean }) {
  return (
    <Link href={item.href} className="block rounded-lg border border-gray-800 bg-gray-950 p-3 transition hover:border-gray-600 hover:bg-gray-900">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate font-bold text-white">{item.name || 'Unnamed'}</p>
        <span className={`shrink-0 text-xs ${isNew ? 'font-bold text-[#FF9A66]' : 'text-gray-500'}`}>{timeAgo(item.date)}</span>
      </div>
      {item.business && <p className="truncate text-sm text-gray-400">{item.business}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <SourceBadge item={item} />
        {item.kind !== 'onboarding' && item.status && item.status !== 'new' && <StatusBadge status={item.status} />}
      </div>
      {item.kind === 'onboarding' ? (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
            <div className="h-full bg-[#F46325]" style={{ width: `${item.progress ?? 0}%` }} />
          </div>
          <p className="mt-1 truncate text-xs text-gray-500">{item.detail}</p>
        </div>
      ) : (
        item.detail && <p className="mt-2 truncate text-xs text-gray-500">{item.detail}</p>
      )}
    </Link>
  );
}

function Board({ items, fetchedAt }: { items: OverviewItem[]; fetchedAt: number }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <div className="flex gap-4">
        {STAGES.map((stage) => {
          const cards = items.filter(stage.match);
          return (
            <section
              key={stage.id}
              className={`flex w-72 shrink-0 flex-col rounded-xl border 2xl:w-auto 2xl:flex-1 ${
                stage.accent && cards.length > 0 ? 'border-[#F46325]/60 bg-[#F46325]/5' : 'border-gray-800 bg-gray-900/60'
              }`}
            >
              <header className="border-b border-gray-800 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-black">{stage.label}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      stage.accent && cards.length > 0 ? 'bg-[#F46325] text-white' : 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    {cards.length}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">{stage.hint}</p>
              </header>
              <div className="max-h-[65vh] flex-1 space-y-2 overflow-y-auto p-3">
                {cards.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-600">Nothing here</p>
                ) : (
                  cards.slice(0, COLUMN_LIMIT).map((i) => <PipelineCard key={`${i.kind}-${i.id}`} item={i} isNew={fetchedAt - new Date(i.date).getTime() < WEEK} />)
                )}
                {cards.length > COLUMN_LIMIT && (
                  <Link href={stage.id === 'lead' ? '/admin/leads' : '/admin/website'} className="block py-2 text-center text-sm font-semibold text-gray-400 hover:text-white">
                    +{cards.length - COLUMN_LIMIT} more <ArrowRight className="inline h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

const FILTERS: { id: 'all' | Source; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'video_offer', label: 'Free video' },
  { id: 'contact', label: 'Contact form' },
  { id: 'tool', label: 'Free tool' },
  { id: 'onboarding', label: 'Onboarding' },
];

function ContactList({ items, fetchedAt }: { items: OverviewItem[]; fetchedAt: number }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | Source>('all');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) => (filter === 'all' || i.kind === filter) && (!q || `${i.name} ${i.business} ${i.detail}`.toLowerCase().includes(q))
    );
  }, [items, query, filter]);

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900">
      <div className="flex flex-col gap-3 border-b border-gray-800 p-4 md:flex-row md:items-center md:justify-between">
        <label className="relative block md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, business, email…"
            className="w-full rounded-lg border border-gray-700 bg-gray-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 focus:border-[#F46325] focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                filter === f.id ? 'bg-[#F46325] text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="p-8 text-center text-gray-500">No matches.</p>
      ) : (
        <>
          {/* Desktop table */}
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 lg:table-cell">Details</th>
                <th className="px-4 py-3 text-right">Last activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {rows.map((i) => (
                <tr key={`${i.kind}-${i.id}`} className="group relative hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <Link href={i.href} className="font-bold text-white after:absolute after:inset-0">
                      {i.name || 'Unnamed'}
                    </Link>
                    {i.business && <p className="text-gray-400">{i.business}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <SourceBadge item={i} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={i.status} />
                  </td>
                  <td className="hidden max-w-xs truncate px-4 py-3 text-gray-500 lg:table-cell">{i.detail}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right text-xs ${fetchedAt - new Date(i.date).getTime() < WEEK ? 'font-bold text-[#FF9A66]' : 'text-gray-500'}`}>
                    {timeAgo(i.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <ul className="divide-y divide-gray-800 md:hidden">
            {rows.map((i) => (
              <li key={`${i.kind}-${i.id}`}>
                <Link href={i.href} className="block px-4 py-3 hover:bg-gray-800/50">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate font-bold">{i.name || 'Unnamed'}</p>
                    <span className="shrink-0 text-xs text-gray-500">{timeAgo(i.date)}</span>
                  </div>
                  {i.business && <p className="truncate text-sm text-gray-400">{i.business}</p>}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <SourceBadge item={i} />
                    <StatusBadge status={i.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="border-t border-gray-800 px-4 py-3 text-xs text-gray-500">
        Showing {rows.length} of {items.length}
      </p>
    </section>
  );
}

export function DashboardStats() {
  const [data, setData] = useState<Overview | null>(null);
  const [fetchedAt, setFetchedAt] = useState(0);
  const [sendType, setSendType] = useState<MessageType | null>(null);
  const view = useSyncExternalStore(subscribeView, readView, () => 'board' as View);

  const load = useCallback(
    () =>
      fetch('/api/admin/overview', { cache: 'no-store' })
        .then((res) => (res.ok ? (res.json() as Promise<Overview>) : null))
        .then((overview) => {
          if (!overview) return;
          setData(overview);
          setFetchedAt(Date.now());
        })
        .catch((error) => console.error('Overview fetch error:', error)),
    []
  );

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const items = data?.items ?? [];
  const s = data?.stats;
  const n = (v?: number) => (s ? (v ?? 0) : '–');
  // Count from the items, not stats.onboarding: combined website + social links appear in both of those.
  const countOnboarding = (statuses: string[]) => (s ? items.filter((i) => i.kind === 'onboarding' && statuses.includes(i.status)).length : undefined);
  const waiting = countOnboarding(['sent', 'opened', 'in_progress']);
  const toReview = countOnboarding(['submitted']);
  const complete = countOnboarding(['complete']);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black sm:text-4xl">Pipeline</h1>
          <p className="mt-1 text-gray-400">Every lead and client, from first contact to fully onboarded.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSendType('website_onboarding')}
            className="inline-flex items-center gap-2 rounded-lg bg-[#F46325] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#FF7B42]"
          >
            <Plus className="h-4 w-4" /> <Globe className="h-4 w-4" /> Website link
          </button>
          <button
            type="button"
            onClick={() => setSendType('social_onboarding')}
            className="inline-flex items-center gap-2 rounded-lg bg-[#F46325] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#FF7B42]"
          >
            <Plus className="h-4 w-4" /> <Share2 className="h-4 w-4" /> Social link
          </button>
          <button
            type="button"
            onClick={() => setSendType('zoom')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-4 py-2.5 text-sm font-bold text-gray-200 hover:border-[#F46325] hover:text-white"
          >
            <Send className="h-4 w-4" /> Zoom / any link
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Kpi label="Total leads" value={n(s?.totalLeads)} sub={s ? `${s.videoOffers} video · ${s.contacts} contact · ${s.toolLeads} tool` : undefined} />
        <Kpi label="New this week" value={n(s?.leadsThisWeek)} sub="Leads in the last 7 days" />
        <Kpi label="Waiting on client" value={n(waiting)} sub="Onboarding links out" />
        <Kpi label="Ready to review" value={n(toReview)} sub="Clients finished onboarding" accent={!!toReview} />
        <Kpi label="Onboarded" value={n(complete)} sub="Marked complete" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-gray-800 bg-gray-900 p-1">
          {(
            [
              ['board', 'Board', Columns3],
              ['list', 'List', List],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => writeView(id)}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-bold transition ${
                view === id ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">{fetchedAt ? 'Updates every 15s' : 'Loading…'}</p>
      </div>

      {!data ? (
        <p className="rounded-xl border border-gray-800 bg-gray-900 p-10 text-center text-gray-500">Loading…</p>
      ) : view === 'board' ? (
        <Board items={items} fetchedAt={fetchedAt} />
      ) : (
        <ContactList items={items} fetchedAt={fetchedAt} />
      )}

      {sendType && <SendModal defaultType={sendType} onClose={() => setSendType(null)} onSent={load} />}
    </div>
  );
}
