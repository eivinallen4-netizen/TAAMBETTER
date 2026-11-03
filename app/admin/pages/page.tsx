'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Bot, FileText, History, Plus, User } from 'lucide-react';
import { PAGE_STATUSES, STATUS_LABEL, type PageStatus } from '@/lib/pages/rules';
import { PageStatusBadge, chip, day } from './ui';

// SEO pages at /insights. Claude's weekly run drafts them over MCP (create_page) into "Needs
// review"; the team checks each one against its source videos, then publishes or rejects it.

interface PageRow {
  id: string;
  slug: string;
  title: string;
  main_keyword: string;
  status: PageStatus;
  created_by: string;
  created_by_kind: 'claude' | 'team';
  rejection_note: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

type Tab = 'needs_review' | 'all' | PageStatus;

export default function PagesList() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('needs_review');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [rows, setRows] = useState<PageRow[]>([]);
  const [counts, setCounts] = useState<Record<PageStatus, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const params = new URLSearchParams({ sort });
    if (tab !== 'all') params.set('status', tab);
    if (query.trim()) params.set('q', query.trim());
    try {
      const res = await fetch(`/api/admin/pages?${params}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load pages');
      setRows(data.data);
      setCounts(data.counts);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load pages');
    } finally {
      setLoading(false);
    }
  }, [tab, query, sort]);

  useEffect(() => {
    const t = setTimeout(load, query ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  const tabs: Tab[] = ['needs_review', 'all', ...PAGE_STATUSES.filter((s) => s !== 'needs_review')];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-4xl font-black">
            <FileText className="h-8 w-8 text-[#F46325]" /> SEO pages
          </h1>
          <p className="mt-1 max-w-2xl text-gray-400">
            Pages at /insights. Claude drafts them every week from creator videos; check each one against its sources, then publish or reject it with a note.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/pages/activity"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-4 py-2.5 text-sm font-bold text-gray-200 hover:border-[#F46325] hover:text-white"
          >
            <History className="h-4 w-4" /> Activity log
          </Link>
          <Link
            href="/admin/pages/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#F46325] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#FF7B42]"
          >
            <Plus className="h-4 w-4" /> New page
          </Link>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {tabs.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={chip(tab === t)}>
            {t === 'all' ? 'All' : STATUS_LABEL[t]}{' '}
            <span className={t === 'needs_review' && (counts?.needs_review ?? 0) > 0 && tab !== t ? 'rounded-full bg-amber-400 px-1.5 text-xs font-black text-black' : 'opacity-70'}>
              {t === 'all' ? total : counts?.[t] ?? 0}
            </span>
          </button>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort"
          className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-[#F46325] focus:outline-none"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="updated">Recently edited</option>
          <option value="published">Recently published</option>
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title or keyword…"
          className="ml-auto w-64 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#F46325] focus:outline-none"
        />
      </div>

      {error && <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-700 text-xs uppercase tracking-wider text-gray-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Main keyword</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created by</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Published</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  {query ? 'Nothing matches.' : tab === 'needs_review' ? 'Nothing waiting for review.' : 'No pages here yet.'}
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} onClick={() => router.push(`/admin/pages/${p.id}`)} className="cursor-pointer border-b border-gray-800 last:border-0 hover:bg-gray-800/60">
                  <td className="max-w-md px-4 py-3">
                    <Link href={`/admin/pages/${p.id}`} className="font-bold text-white" onClick={(e) => e.stopPropagation()}>
                      {p.title}
                    </Link>
                    <span className="block text-xs text-gray-500">/insights/{p.slug}</span>
                    {p.rejection_note && <span className="mt-1 block text-xs text-red-300/80">Rejected: {p.rejection_note}</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{p.main_keyword}</td>
                  <td className="px-4 py-3">
                    <PageStatusBadge status={p.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-300">
                    <span className="inline-flex items-center gap-1.5">
                      {p.created_by_kind === 'claude' ? <Bot className="h-3.5 w-3.5 text-[#FF9A66]" /> : <User className="h-3.5 w-3.5 text-gray-500" />}
                      {p.created_by_kind === 'claude' ? 'Claude weekly run' : p.created_by || 'Team'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-400">{day(p.created_at)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-400">{p.published_at ? day(p.published_at) : <span className="text-gray-600">—</span>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
