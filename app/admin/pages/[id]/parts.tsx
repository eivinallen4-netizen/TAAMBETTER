'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, Loader2, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { FIELD_LABEL, META_DESCRIPTION_MAX, META_TITLE_MAX, type FaqItem, type PageFields } from '@/lib/pages/rules';
import { diffLines, fieldText } from '@/lib/pages/diff';
import { inputClass, when } from '../ui';

// Pieces of the page editor (/admin/pages/[id]).

export function Counter({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <span className={`text-xs font-bold tabular-nums ${over ? 'text-red-400' : value.length > max * 0.9 ? 'text-amber-300' : 'text-gray-500'}`}>
      {value.length} / {max}
    </span>
  );
}

/** Roughly how Google shows the result: breadcrumb URL, blue title, grey description. */
export function SnippetPreview({ slug, metaTitle, metaDescription }: { slug: string; metaTitle: string; metaDescription: string }) {
  const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
  return (
    <div className="rounded-lg bg-white p-4 font-sans text-left">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F46325] text-[10px] font-black text-white">T</span>
        <div className="min-w-0 leading-tight">
          <p className="text-sm text-[#202124]">TAAM</p>
          <p className="truncate text-xs text-[#4d5156]">https://www.taammarketing.com › insights › {slug || 'your-slug'}</p>
        </div>
      </div>
      <p className="mt-2 text-xl leading-snug text-[#1a0dab]">{cut(metaTitle || 'Meta title', META_TITLE_MAX)}</p>
      <p className="mt-1 text-sm leading-relaxed text-[#4d5156]">{cut(metaDescription || 'Meta description', META_DESCRIPTION_MAX)}</p>
      <div className="mt-3 flex gap-4 border-t border-gray-200 pt-2 text-[11px] font-semibold">
        <span className={metaTitle.length > META_TITLE_MAX ? 'text-red-600' : 'text-gray-500'}>
          Title {metaTitle.length}/{META_TITLE_MAX}
        </span>
        <span className={metaDescription.length > META_DESCRIPTION_MAX ? 'text-red-600' : 'text-gray-500'}>
          Description {metaDescription.length}/{META_DESCRIPTION_MAX}
        </span>
      </div>
    </div>
  );
}

export function FaqEditor({ value, onChange }: { value: FaqItem[]; onChange: (v: FaqItem[]) => void }) {
  const set = (i: number, patch: Partial<FaqItem>) => onChange(value.map((f, n) => (n === i ? { ...f, ...patch } : f)));
  const move = (i: number, by: number) => {
    const next = [...value];
    const [item] = next.splice(i, 1);
    next.splice(i + by, 0, item);
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {value.map((f, i) => (
        <div key={i} className="rounded-lg border border-gray-700 bg-gray-900/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Q&amp;A {i + 1}</span>
            <span className="flex gap-1">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up" className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-30">
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={i === value.length - 1}
                onClick={() => move(i, 1)}
                aria-label="Move down"
                className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-30"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => onChange(value.filter((_, n) => n !== i))} aria-label="Remove" className="rounded p-1 text-gray-400 hover:bg-red-500/20 hover:text-red-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </span>
          </div>
          <input value={f.question} onChange={(e) => set(i, { question: e.target.value })} placeholder="Question" className={`${inputClass} mb-2`} />
          <textarea value={f.answer} onChange={(e) => set(i, { answer: e.target.value })} placeholder="Answer" rows={3} className={inputClass} />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { question: '', answer: '' }])}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-600 px-3 py-2 text-sm font-semibold text-gray-300 hover:border-[#F46325] hover:text-white"
      >
        <Plus className="h-4 w-4" /> Add question
      </button>
    </div>
  );
}

export function VideoList({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const url = draft.trim();
    if (url && !value.includes(url)) onChange([...value, url]);
    setDraft('');
  };
  return (
    <div className="space-y-2">
      {value.length === 0 && <p className="text-sm text-gray-500">No source videos listed.</p>}
      {value.map((url) => (
        <div key={url} className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2">
          <a href={url} target="_blank" rel="noreferrer" className="flex min-w-0 flex-1 items-center gap-2 text-sm text-[#FF9A66] hover:text-white">
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{url}</span>
          </a>
          <button type="button" onClick={() => onChange(value.filter((u) => u !== url))} aria-label="Remove" className="rounded p-1 text-gray-400 hover:bg-red-500/20 hover:text-red-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="https://www.youtube.com/watch?v=…"
          className={inputClass}
        />
        <button type="button" onClick={add} className="rounded-lg border border-gray-600 px-3 text-sm font-bold text-gray-200 hover:border-[#F46325] hover:text-white">
          Add
        </button>
      </div>
    </div>
  );
}

// ---------- History ----------

export interface Revision {
  id: string;
  action: string;
  changed_fields: string[];
  note: string;
  created_by: string;
  created_at: string;
}

type Snapshot = PageFields & { status: string };

export function HistoryPanel({ pageId, revisions, onRestored }: { pageId: string; revisions: Revision[]; onRestored: (data: unknown) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div>
      <ol className="space-y-2">
        {revisions.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => setOpenId(r.id)}
              className="w-full rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2.5 text-left hover:border-[#F46325]"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-bold capitalize text-white">{r.action}</span>
                <span className="whitespace-nowrap text-xs text-gray-500">{when(r.created_at)}</span>
              </span>
              <span className="block text-xs text-gray-400">
                {r.created_by}
                {r.changed_fields.length > 0 && ` · ${r.changed_fields.map((f) => FIELD_LABEL[f as keyof PageFields] ?? f).join(', ')}`}
              </span>
              {r.note && <span className="mt-1 block text-xs text-gray-300">“{r.note}”</span>}
            </button>
          </li>
        ))}
      </ol>
      {openId && <DiffModal pageId={pageId} revisionId={openId} onClose={() => setOpenId(null)} onRestored={(d) => (setOpenId(null), onRestored(d))} />}
    </div>
  );
}

function DiffModal({ pageId, revisionId, onClose, onRestored }: { pageId: string; revisionId: string; onClose: () => void; onRestored: (data: unknown) => void }) {
  const [data, setData] = useState<{ revision: Revision; snapshot: Snapshot; previous: Snapshot | null } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/pages/${pageId}/revisions/${revisionId}`, { cache: 'no-store' })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Could not load this version');
        setData(d);
      })
      .catch((err) => setError(err.message));
  }, [pageId, revisionId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function restore() {
    if (!window.confirm('Put this version back? It is saved as a new revision; nothing is lost.')) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/pages/${pageId}/revisions/${revisionId}`, { method: 'POST' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Could not restore this version');
      onRestored(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not restore this version');
    } finally {
      setBusy(false);
    }
  }

  const fields = data
    ? (Object.keys(FIELD_LABEL) as (keyof PageFields)[]).filter((f) => fieldText(data.snapshot[f]) !== fieldText(data.previous?.[f] ?? ''))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:p-10">
      <div className="w-full max-w-4xl rounded-xl border border-gray-700 bg-gray-950">
        <div className="sticky top-0 flex items-start justify-between gap-4 rounded-t-xl border-b border-gray-800 bg-gray-950 px-6 py-4">
          <div>
            <h2 className="text-xl font-black capitalize">{data?.revision.action ?? 'Version'}</h2>
            {data && (
              <p className="text-sm text-gray-400">
                {data.revision.created_by} · {when(data.revision.created_at)} · status {data.snapshot.status.replace('_', ' ')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <button
                type="button"
                onClick={restore}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-600 px-3 py-2 text-sm font-bold text-gray-200 hover:border-[#F46325] hover:text-white disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Restore this version
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="space-y-6 px-6 py-5">
          {error && <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
          {!data && !error && <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-500" />}
          {data && fields.length === 0 && <p className="text-sm text-gray-400">No content changed in this version (status change only).</p>}
          {data &&
            fields.map((f) => (
              <section key={f}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">{FIELD_LABEL[f]}</p>
                <pre className="max-h-[28rem] overflow-auto rounded-lg border border-gray-800 bg-black/40 p-3 text-xs leading-relaxed">
                  {diffLines(fieldText(data.previous?.[f] ?? ''), fieldText(data.snapshot[f])).map((l, i) => (
                    <div
                      key={i}
                      className={
                        l.type === 'add' ? 'bg-emerald-500/15 text-emerald-200' : l.type === 'del' ? 'bg-red-500/15 text-red-300 line-through decoration-red-400/50' : 'text-gray-500'
                      }
                    >
                      <span className="mr-2 select-none opacity-60">{l.type === 'add' ? '+' : l.type === 'del' ? '−' : ' '}</span>
                      {l.text || ' '}
                    </div>
                  ))}
                </pre>
              </section>
            ))}
        </div>
      </div>
    </div>
  );
}
