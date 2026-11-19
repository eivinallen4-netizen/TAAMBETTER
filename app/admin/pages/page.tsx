'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bot, FileText, History, Plus, User } from 'lucide-react';
import { Empty, LinkButton, Notice, PageHeader, Table } from '@taam/crm/client';
import { PAGE_STATUSES, STATUS_LABEL, type PageStatus } from '@/lib/pages/rules';
import { SearchInput, SelectInput, Tabs } from '../components/crm-ui';
import { PageStatusBadge, day } from './ui';

// SEO pages at /blog. Claude's weekly run drafts them over MCP (create_page) into "Needs
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

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'updated', label: 'Recently edited' },
  { value: 'published', label: 'Recently published' },
];

function SkeletonRows() {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--crm-line)]" aria-busy="true" aria-label="Loading pages">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-6 border-b border-[var(--crm-line)] px-4 py-4 last:border-0">
          <div className="crm-skeleton h-3 w-1/3 rounded" />
          <div className="crm-skeleton h-3 w-1/5 rounded" />
          <div className="crm-skeleton ml-auto h-3 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function PagesList() {
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
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="SEO pages"
        subtitle="Pages at /blog. Claude drafts them every week from creator videos. Check each one against its sources, then publish it or reject it with a note."
        actions={
          <>
            <LinkButton href="/pages/activity" variant="secondary">
              <History className="size-4" aria-hidden /> Activity log
            </LinkButton>
            <LinkButton href="/pages/new" variant="primary">
              <Plus className="size-4" aria-hidden /> New page
            </LinkButton>
          </>
        }
      />

      <Tabs
        label="Status"
        value={tab}
        onChange={setTab}
        options={tabs.map((t) => ({
          value: t,
          label: t === 'all' ? 'All' : STATUS_LABEL[t],
          count: counts ? (t === 'all' ? total : counts[t] ?? 0) : undefined,
        }))}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput label="Search title or keyword" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full sm:w-auto sm:min-w-56 sm:flex-1" />
        <SelectInput aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} options={SORTS} />
      </div>

      {error && (
        <div className="mb-4">
          <Notice tone="bad" title="Could not load pages">
            {error}
          </Notice>
        </div>
      )}

      {loading ? (
        <SkeletonRows />
      ) : (
        <Table
          caption="SEO pages"
          rows={rows}
          rowKey={(p) => p.id}
          href={(p) => `/pages/${p.id}`}
          cards
          empty={
            <Empty icon={FileText} title={query ? 'Nothing matches that search' : tab === 'needs_review' ? 'Nothing waiting for review' : 'No pages here yet'}>
              {query ? 'Try a different word, or clear the search.' : tab === 'needs_review' ? 'New drafts from the weekly run show up here.' : undefined}
            </Empty>
          }
          columns={[
            {
              header: 'Title',
              cell: (p) => (
                <div className="min-w-0 max-w-[22rem]">
                  <span className="block truncate font-semibold text-[var(--crm-ink)]">{p.title}</span>
                  <span className="block truncate text-xs text-[var(--crm-muted)]">/blog/{p.slug}</span>
                  {p.rejection_note && <span className="mt-1 block text-xs text-[var(--crm-bad)]">Rejected: {p.rejection_note}</span>}
                </div>
              ),
            },
            { header: 'Main keyword', wide: true, className: 'whitespace-nowrap', cell: (p) => <span className="block max-w-[12rem] truncate text-[var(--crm-muted)]" title={p.main_keyword}>{p.main_keyword}</span> },
            {
              header: 'Status',
              className: 'whitespace-nowrap',
              cell: (p) => (
                <span className="block">
                  <PageStatusBadge status={p.status} />
                  {p.published_at && <span className="mt-1 block text-xs tabular-nums text-[var(--crm-muted)]">{day(p.published_at)}</span>}
                </span>
              ),
            },
            {
              header: 'Created by',
              wide: true,
              cell: (p) => (
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[var(--crm-muted)]">
                  {p.created_by_kind === 'claude' ? <Bot className="size-3.5" aria-hidden /> : <User className="size-3.5" aria-hidden />}
                  {p.created_by_kind === 'claude' ? 'Claude weekly run' : p.created_by || 'Team'}
                </span>
              ),
            },
            { header: 'Created', align: 'right', cell: (p) => <span className="whitespace-nowrap tabular-nums text-[var(--crm-muted)]">{day(p.created_at)}</span> },
          ]}
        />
      )}
    </div>
  );
}
