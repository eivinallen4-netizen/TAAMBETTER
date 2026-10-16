'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Plus, Send } from 'lucide-react';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { ONBOARDING_STATUSES, STATUS_LABELS, type OnboardingKind } from '@/app/lib/onboarding';
import { StatusBadge } from './StatusBadge';
import { CopyButton, KIND_META, KindBadge, type LinkKind } from './NewOnboardingModal';
import { SendModal, type Recipient } from './SendModal';

interface OnboardingListItem {
  id: string;
  kind: OnboardingKind;
  step_count: number;
  client_name: string;
  business_name: string;
  client_email: string;
  status: string;
  current_step: number;
  social_count: number;
  website: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  paid_at: string | null;
  url: string;
}

export function OnboardingList({ kind }: { kind: LinkKind }) {
  useAdminAuth();
  const [items, setItems] = useState<OnboardingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [resendTo, setResendTo] = useState<Recipient | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/onboarding', { cache: 'no-store' });
      const data = await res.json();
      // Old combined links (website + social) show on both lists.
      setItems(((data.data ?? []) as OnboardingListItem[]).filter((i) => i.kind === kind || i.kind === 'full'));
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const meta = KIND_META[kind];
  const Icon = meta.icon;
  const q = search.trim().toLowerCase();
  const visible = items.filter(
    (i) =>
      (filter === 'all' || i.status === filter) &&
      (!q || [i.client_name, i.business_name, i.client_email].some((v) => v?.toLowerCase().includes(q)))
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-4xl font-black">
            <Icon className="h-8 w-8 text-[#F46325]" /> {kind === 'website' ? 'Website onboarding' : 'Social media onboarding'}
          </h1>
          <p className="mt-1 max-w-2xl text-gray-400">{meta.covers} For paid clients: send each one their own link and watch their answers land here.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#F46325] px-5 py-3 font-bold text-white hover:bg-[#FF7B42]"
        >
          <Plus className="h-5 w-5" /> New {kind === 'website' ? 'website' : 'social media'} link
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {['all', ...ONBOARDING_STATUSES].map((s) => {
          const count = s === 'all' ? items.length : items.filter((i) => i.status === s).length;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                filter === s ? 'bg-[#F46325] text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_LABELS[s as keyof typeof STATUS_LABELS]} <span className="opacity-70">{count}</span>
            </button>
          );
        })}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients…"
          className="ml-auto w-64 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#F46325] focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-700 text-xs uppercase tracking-wider text-gray-400">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">{kind === 'website' ? 'Current site' : 'Accounts'}</th>
              <th className="px-4 py-3">Last activity</th>
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
                  {items.length === 0 ? `No ${kind === 'website' ? 'website' : 'social media'} links yet. Create your first one.` : 'Nothing matches.'}
                </td>
              </tr>
            ) : (
              visible.map((i) => {
                const done = i.status === 'submitted' || i.status === 'complete';
                const pct = done ? 100 : Math.round((Math.min(i.current_step, i.step_count - 1) / (i.step_count - 1)) * 100);
                return (
                  <tr key={i.id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/60">
                    <td className="px-4 py-3">
                      <Link href={`/admin/onboarding/${i.id}`} className="block">
                        <span className="font-bold text-white hover:text-[#F46325]">{i.client_name}</span>
                        <span className="block text-xs text-gray-400">{i.business_name || i.client_email || '—'}</span>
                        {i.kind === 'full' && (
                          <span className="mt-1 block">
                            <KindBadge kind={i.kind} />
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={i.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-700">
                          <div className="h-full bg-[#F46325]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{pct}%</span>
                      </div>
                    </td>
                    <td className="max-w-[14rem] truncate px-4 py-3 text-gray-300">{kind === 'website' ? i.website || '—' : i.social_count}</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(i.updated_at).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CopyButton text={i.url} />
                        {!done && (
                          <button
                            type="button"
                            onClick={() =>
                              setResendTo({ name: i.client_name, email: i.client_email, businessName: i.business_name, source: 'onboarding', sourceId: i.id, paid: !!i.paid_at })
                            }
                            className="text-gray-400 hover:text-white"
                            aria-label="Email the link"
                            title="Email the link (branded)"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                        <a href={i.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white" aria-label="Open link">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showNew && <SendModal defaultType={kind === 'website' ? 'website_onboarding' : 'social_onboarding'} onClose={() => setShowNew(false)} onSent={load} />}
      {resendTo && <SendModal recipient={resendTo} defaultType={kind === 'website' ? 'website_onboarding' : 'social_onboarding'} onClose={() => setResendTo(null)} onSent={load} />}
    </div>
  );
}
