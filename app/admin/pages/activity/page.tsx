'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { Bot, CheckCircle2, ChevronDown, History, User, XCircle } from 'lucide-react';
import { Badge, Button, Empty, Notice, PageHeader } from '@taam/crm/client';
import { SearchInput, Tabs } from '../../components/crm-ui';
import { when } from '../ui';

// Every MCP / REST tool call Claude makes and every admin action on SEO pages, newest first.

interface Entry {
  id: string;
  source: 'mcp' | 'api' | 'admin';
  actor: string;
  action: string;
  target: string;
  detail: string;
  ok: boolean;
  error: string;
  created_at: string;
}

type Source = '' | 'mcp' | 'api' | 'admin';

const SOURCES: { value: Source; label: string }[] = [
  { value: '', label: 'Everything' },
  { value: 'mcp', label: 'MCP tool calls' },
  { value: 'api', label: 'REST API' },
  { value: 'admin', label: 'Admin actions' },
];

const SOURCE_LABEL: Record<Entry['source'], string> = { mcp: 'MCP', api: 'API', admin: 'Admin' };

const PAGE_SIZE = 200;

/** Long details are cut when logged, so they may not parse. */
function pretty(detail: string): string {
  if (!detail) return 'No details';
  try {
    return JSON.stringify(JSON.parse(detail), null, 2);
  } catch {
    return detail;
  }
}

const TH = 'crm-eyebrow px-4 py-3';

export default function ActivityLog() {
  const [source, setSource] = useState<Source>('');
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(
    async (offset = 0) => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (source) params.set('source', source);
      if (query.trim()) params.set('q', query.trim());
      if (offset) setMore(true);
      try {
        const res = await fetch(`/api/admin/activity?${params}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load the activity log');
        setEntries((prev) => (offset ? [...prev, ...data.data] : data.data));
        setTotal(data.total);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load the activity log');
      } finally {
        setLoading(false);
        setMore(false);
      }
    },
    [source, query]
  );

  useEffect(() => {
    const t = setTimeout(() => load(0), query ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Activity log"
        subtitle="Every tool call Claude makes over MCP or the API, and every change the team makes to SEO pages."
        breadcrumbs={[{ label: 'SEO pages', href: '/pages' }, { label: 'Activity log' }]}
      />

      <Tabs label="Source" value={source} onChange={setSource} options={SOURCES} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput label="Search who, tool or page" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full sm:w-auto sm:min-w-56 sm:flex-1" />
      </div>

      {error && (
        <div className="mb-4">
          <Notice tone="bad" title="Could not load the activity log" action={<Button size="sm" onClick={() => load(0)}>Try again</Button>}>
            {error}
          </Notice>
        </div>
      )}

      {!loading && entries.length === 0 ? (
        <Empty icon={History} title={query ? 'Nothing matches that search' : 'Nothing logged yet'}>
          {query ? 'Try a different word, or clear the search.' : 'Tool calls and page changes show up here as they happen.'}
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--crm-line)]">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Activity log</caption>
            <thead>
              <tr className="border-b border-[var(--crm-line)]">
                <th scope="col" className={TH}>When</th>
                <th scope="col" className={TH}>Who</th>
                <th scope="col" className={TH}>What</th>
                <th scope="col" className={`${TH} hidden md:table-cell`}>On</th>
                <th scope="col" className={TH}>Result</th>
                <th scope="col" className="w-8"><span className="sr-only">Details</span></th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [0, 1, 2, 3, 4].map((i) => (
                    <tr key={i} className="border-b border-[var(--crm-line)] last:border-0" aria-hidden>
                      <td className="px-4 py-4" colSpan={6}>
                        <div className="crm-skeleton h-3 w-2/3 rounded" />
                      </td>
                    </tr>
                  ))
                : entries.map((e) => {
                    const open = openId === e.id;
                    return (
                      <Fragment key={e.id}>
                        <tr
                          onClick={() => setOpenId(open ? null : e.id)}
                          className="cursor-pointer border-b border-[var(--crm-line)] transition-colors last:border-0 hover:bg-[var(--crm-raised)]"
                        >
                          <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[var(--crm-muted)]">{when(e.created_at)}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="inline-flex items-center gap-1.5">
                              {e.source === 'admin' ? <User className="size-3.5 text-[var(--crm-muted)]" aria-hidden /> : <Bot className="size-3.5 text-[var(--crm-muted)]" aria-hidden />}
                              {e.actor}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-2">
                              <code className="rounded bg-[var(--crm-line)] px-1.5 py-0.5 font-mono text-xs">{e.action}</code>
                              <Badge>{SOURCE_LABEL[e.source] ?? e.source}</Badge>
                            </span>
                          </td>
                          <td className="hidden max-w-xs truncate px-4 py-3 text-[var(--crm-muted)] md:table-cell">{e.target}</td>
                          <td className="px-4 py-3">
                            {e.ok ? (
                              <span className="inline-flex items-center gap-1.5 text-[var(--crm-ok)]">
                                <CheckCircle2 className="size-4" aria-hidden /> OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--crm-bad)]">
                                <XCircle className="size-4 shrink-0" aria-hidden /> <span className="line-clamp-1">{e.error || 'Failed'}</span>
                              </span>
                            )}
                          </td>
                          <td className="pr-3">
                            <button
                              type="button"
                              aria-expanded={open}
                              aria-label={open ? 'Hide details' : 'Show details'}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                setOpenId(open ? null : e.id);
                              }}
                              className="grid size-7 place-items-center rounded-[var(--crm-radius-control)] text-[var(--crm-muted)] hover:text-[var(--crm-ink)]"
                            >
                              <ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
                            </button>
                          </td>
                        </tr>
                        {open && (
                          <tr className="border-b border-[var(--crm-line)] bg-[var(--crm-raised)]">
                            <td colSpan={6} className="px-4 py-3">
                              {e.error && <p className="mb-2 text-sm text-[var(--crm-bad)]">{e.error}</p>}
                              <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all font-mono text-xs text-[var(--crm-muted)]">{pretty(e.detail)}</pre>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
            </tbody>
          </table>
        </div>
      )}
      {!loading && entries.length < total && (
        <div className="mt-4">
          <Button variant="secondary" busy={more} busyLabel="Loading…" onClick={() => load(entries.length)}>
            Load more ({total - entries.length} older)
          </Button>
        </div>
      )}
    </div>
  );
}
