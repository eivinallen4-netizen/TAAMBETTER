'use client';

import Link from 'next/link';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Bot, CheckCircle2, History, User, XCircle } from 'lucide-react';
import { chip, when } from '../ui';

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

const SOURCES = [
  ['', 'Everything'],
  ['mcp', 'MCP tool calls'],
  ['api', 'REST API'],
  ['admin', 'Admin actions'],
] as const;

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

export default function ActivityLog() {
  const [source, setSource] = useState('');
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(
    async (offset = 0) => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (source) params.set('source', source);
      if (query.trim()) params.set('q', query.trim());
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
      }
    },
    [source, query]
  );

  useEffect(() => {
    const t = setTimeout(() => load(0), query ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  return (
    <div>
      <Link href="/admin/pages" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> SEO pages
      </Link>
      <div className="mb-8 mt-3">
        <h1 className="flex items-center gap-3 text-4xl font-black">
          <History className="h-8 w-8 text-[#F46325]" /> Activity log
        </h1>
        <p className="mt-1 max-w-2xl text-gray-400">Every tool call Claude makes over MCP or the API, and every change the team makes to SEO pages.</p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {SOURCES.map(([value, label]) => (
          <button key={value} type="button" onClick={() => setSource(value)} className={chip(source === value)}>
            {label}
          </button>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search who, tool or page…"
          className="ml-auto w-64 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-[#F46325] focus:outline-none"
        />
      </div>

      {error && <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-700 text-xs uppercase tracking-wider text-gray-400">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Who</th>
              <th className="px-4 py-3">What</th>
              <th className="px-4 py-3">On</th>
              <th className="px-4 py-3">Result</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  Nothing logged yet.
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <Fragment key={e.id}>
                  <tr onClick={() => setOpenId(openId === e.id ? null : e.id)} className="cursor-pointer border-b border-gray-800 last:border-0 hover:bg-gray-800/60">
                    <td className="whitespace-nowrap px-4 py-3 text-gray-400">{when(e.created_at)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-200">
                      <span className="inline-flex items-center gap-1.5">
                        {e.source === 'admin' ? <User className="h-3.5 w-3.5 text-gray-500" /> : <Bot className="h-3.5 w-3.5 text-[#FF9A66]" />}
                        {e.actor}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-white">{e.action}</code>
                      <span className="ml-2 text-xs uppercase tracking-wider text-gray-500">{e.source}</span>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-gray-300">{e.target}</td>
                    <td className="px-4 py-3">
                      {e.ok ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-label="OK" />
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-red-300">
                          <XCircle className="h-4 w-4 shrink-0" /> <span className="line-clamp-1">{e.error}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                  {openId === e.id && (
                    <tr className="border-b border-gray-800 bg-black/30">
                      <td colSpan={5} className="px-4 py-3">
                        {e.error && <p className="mb-2 text-sm text-red-300">{e.error}</p>}
                        <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all text-xs text-gray-300">{pretty(e.detail)}</pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      {entries.length < total && (
        <button type="button" onClick={() => load(entries.length)} className="mt-4 rounded-lg border border-gray-600 px-4 py-2 text-sm font-bold text-gray-200 hover:border-[#F46325] hover:text-white">
          Load more ({total - entries.length} older)
        </button>
      )}
    </div>
  );
}
