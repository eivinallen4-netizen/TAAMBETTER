'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Archive, ArrowLeft, Bot, CheckCircle2, Eye, History, Loader2, RotateCcw, Save, Send, ThumbsDown, Undo2 } from 'lucide-react';
import InsightArticle from '@/components/insights/InsightArticle';
import {
  META_DESCRIPTION_MAX,
  META_TITLE_MAX,
  MIN_BODY_WORDS,
  checkPageFields,
  countWords,
  emptyPageFields,
  slugify,
  type PageFields,
  type PageIssue,
  type PageStatus,
} from '@/lib/pages/rules';
import { Counter, FaqEditor, HistoryPanel, SnippetPreview, VideoList, type Revision } from './parts';
import { PageStatusBadge, inputClass, when } from '../ui';

// Edit one SEO page: fields on the left, the page as it will look on the site on the right.
// Guardrail warnings come from the same code the server runs on save (lib/pages/rules.ts), plus a
// live server check for duplicate slugs and keywords, so nothing that would be refused looks fine here.

interface Page extends PageFields {
  id: string;
  status: PageStatus;
  created_by: string;
  created_by_kind: 'claude' | 'team';
  rejection_note: string;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

interface Conflict {
  field: string;
  message: string;
  existing: { id: string | null; slug: string; title: string; url: string; kind: 'insight' | 'hand-built' };
}

interface Loaded {
  page: Page;
  preview_path: string;
  revisions: Revision[];
}

const fieldsOf = (p: PageFields): PageFields => ({
  slug: p.slug,
  title: p.title,
  meta_title: p.meta_title,
  meta_description: p.meta_description,
  main_keyword: p.main_keyword,
  secondary_keywords: p.secondary_keywords,
  body: p.body,
  faq: p.faq,
  schema_jsonld: p.schema_jsonld,
  source_videos: p.source_videos,
});

function Label({ children, extra }: { children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{children}</span>
      {extra}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-700 bg-gray-900 p-5">
      <h2 className="mb-4 text-sm font-black uppercase tracking-wider text-white">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

const btn = 'inline-flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-bold transition disabled:opacity-40';
const btnGhost = `${btn} border border-gray-600 text-gray-200 hover:border-[#F46325] hover:text-white`;

export default function PageEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === 'new';
  const router = useRouter();

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [fields, setFields] = useState<PageFields>(emptyPageFields());
  const [secondaryText, setSecondaryText] = useState('');
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [pane, setPane] = useState<'preview' | 'history'>('preview');
  const [loadError, setLoadError] = useState('');

  const show = useCallback((data: Loaded) => {
    setLoaded(data);
    setFields(fieldsOf(data.page));
    setSecondaryText(data.page.secondary_keywords.join(', '));
  }, []);

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/pages/${id}`, { cache: 'no-store' })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Could not load this page');
        show(d);
      })
      .catch((err) => setLoadError(err.message));
  }, [id, isNew, show]);

  const set = <K extends keyof PageFields>(key: K, value: PageFields[K]) => setFields((f) => ({ ...f, [key]: value }));

  const saved = loaded ? fieldsOf(loaded.page) : emptyPageFields();
  const dirty = JSON.stringify(fields) !== JSON.stringify(saved);

  // The same checks the server runs on save, live.
  const issues: PageIssue[] = useMemo(() => checkPageFields(fields), [fields]);
  const words = useMemo(() => countWords(fields.body), [fields.body]);

  // Duplicate slug / keyword needs the database: ask the server, debounced.
  useEffect(() => {
    const t = setTimeout(() => {
      if (!fields.slug && !fields.main_keyword) return setConflicts([]);
      fetch('/api/admin/pages/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: isNew ? undefined : id, slug: fields.slug, main_keyword: fields.main_keyword }),
      })
        .then((r) => r.json())
        .then((d) => setConflicts(d.conflicts ?? []))
        .catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [fields.slug, fields.main_keyword, id, isNew]);

  // Don't lose edits to a stray tab close.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function call(label: string, url: string, method: string, body?: unknown): Promise<Loaded | (Page & { id: string }) | null> {
    setBusy(label);
    setError('');
    setNotice('');
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        if (data.conflicts) setConflicts(data.conflicts);
        throw new Error(data.error || 'Something went wrong');
      }
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      return null;
    } finally {
      setBusy('');
    }
  }

  /** Saves if there's anything to save. Returns false when the save was refused. */
  async function save(): Promise<boolean> {
    if (isNew) {
      const created = (await call('save', '/api/admin/pages', 'POST', fields)) as Page | null;
      if (!created) return false;
      router.replace(`/admin/pages/${created.id}`);
      return true;
    }
    if (!dirty) return true;
    const data = (await call('save', `/api/admin/pages/${id}`, 'PATCH', fields)) as Loaded | null;
    if (!data) return false;
    show(data);
    setNotice(data.page.status === 'published' ? 'Saved. The live page is updated.' : 'Saved.');
    return true;
  }

  async function act(action: 'publish' | 'unpublish' | 'archive' | 'restore' | 'reject', note?: string) {
    if (action === 'publish' && !(await save())) return;
    if (action === 'unpublish' && !window.confirm('Take this page off the site? It goes back to draft.')) return;
    if (action === 'archive' && !window.confirm('Archive this page? You can restore it any time.')) return;
    const data = (await call(action, `/api/admin/pages/${id}/actions`, 'POST', { action, note })) as Loaded | null;
    if (!data) return;
    show(data);
    setRejecting(false);
    setRejectNote('');
    setNotice(
      { publish: 'Published. It is live and in the sitemap.', unpublish: 'Unpublished.', archive: 'Archived.', restore: 'Restored to draft.', reject: 'Rejected and archived. Claude will see your note.' }[action]
    );
  }

  if (loadError) {
    return (
      <div>
        <Link href="/admin/pages" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> SEO pages
        </Link>
        <p className="mt-6 text-red-300">{loadError}</p>
      </div>
    );
  }
  if (!isNew && !loaded) return <Loader2 className="mx-auto mt-24 h-6 w-6 animate-spin text-gray-500" />;

  const page = loaded?.page;
  const status = page?.status ?? 'draft';
  const blockers = issues.length + conflicts.length;
  const fieldIssues = (f: keyof PageFields) => issues.filter((i) => i.field === f);
  const fieldBorder = (f: keyof PageFields) => (fieldIssues(f).length || conflicts.some((c) => c.field === f) ? '!border-red-500/70' : '');

  return (
    <div>
      <Link href="/admin/pages" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> SEO pages
      </Link>

      {/* Header + actions */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 mt-3 border-b border-gray-800 bg-taam-near-black/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black sm:text-3xl">{fields.title || (isNew ? 'New page' : 'Untitled')}</h1>
              {page && <PageStatusBadge status={status} />}
              {dirty && <span className="text-xs font-bold text-amber-300">Unsaved changes</span>}
            </div>
            {page && (
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-gray-400">
                {page.created_by_kind === 'claude' && <Bot className="h-3.5 w-3.5 text-[#FF9A66]" />}
                {page.created_by_kind === 'claude' ? 'Claude weekly run' : page.created_by} · created {when(page.created_at)}
                {page.published_at && ` · published ${when(page.published_at)}`}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {status !== 'archived' && (
              <button type="button" onClick={save} disabled={!!busy || (!dirty && !isNew) || blockers > 0} className={`${btn} bg-white text-[#111] hover:bg-gray-200`}>
                {busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {status === 'published' ? 'Save live page' : 'Save draft'}
              </button>
            )}
            {loaded && (
              <a href={loaded.preview_path} target="_blank" rel="noreferrer" className={btnGhost} title={dirty ? 'Shows the last saved version' : undefined}>
                <Eye className="h-4 w-4" /> Preview
              </a>
            )}
            {page && (status === 'draft' || status === 'needs_review') && (
              <button type="button" onClick={() => act('publish')} disabled={!!busy || blockers > 0} className={`${btn} bg-[#F46325] text-white hover:bg-[#FF7B42]`}>
                {busy === 'publish' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publish
              </button>
            )}
            {page && status === 'published' && (
              <button type="button" onClick={() => act('unpublish')} disabled={!!busy} className={btnGhost}>
                <Undo2 className="h-4 w-4" /> Unpublish
              </button>
            )}
            {page && status !== 'archived' && status !== 'published' && (
              <button type="button" onClick={() => setRejecting((r) => !r)} disabled={!!busy} className={btnGhost}>
                <ThumbsDown className="h-4 w-4" /> Reject
              </button>
            )}
            {page && status !== 'archived' && (
              <button type="button" onClick={() => act('archive')} disabled={!!busy} className={btnGhost}>
                <Archive className="h-4 w-4" /> Archive
              </button>
            )}
            {page && status === 'archived' && (
              <button type="button" onClick={() => act('restore')} disabled={!!busy} className={btnGhost}>
                <RotateCcw className="h-4 w-4" /> Restore
              </button>
            )}
          </div>
        </div>

        {rejecting && (
          <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/5 p-4">
            <Label>Why is this page rejected? Claude reads this before suggesting new pages.</Label>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={2}
              placeholder='e.g. "Off-topic for our clients", "Says the creator recommends X, he said the opposite at 4:10"'
              className={inputClass}
            />
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => act('reject', rejectNote)} disabled={!rejectNote.trim() || !!busy} className={`${btn} bg-red-500 text-white hover:bg-red-400`}>
                {busy === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="h-4 w-4" />} Reject and archive
              </button>
              <button type="button" onClick={() => setRejecting(false)} className={btnGhost}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</p>}
        {notice && !error && (
          <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
            <CheckCircle2 className="h-4 w-4" /> {notice}
          </p>
        )}
      </div>

      {page?.rejection_note && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm">
          <span className="font-bold text-red-300">Rejected {when(page.rejected_at)}:</span> <span className="text-gray-200">{page.rejection_note}</span>
        </div>
      )}

      {/* Guardrails */}
      {blockers > 0 ? (
        <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3">
          <p className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-amber-300">
            <AlertTriangle className="h-4 w-4" /> Fix before saving ({blockers})
          </p>
          <ul className="space-y-1 text-sm text-gray-200">
            {conflicts.map((c, i) => (
              <li key={`c${i}`}>
                • {c.message}{' '}
                {c.existing.kind === 'insight' && c.existing.id ? (
                  <Link href={`/admin/pages/${c.existing.id}`} className="font-bold text-[#FF9A66] underline">
                    Open that page
                  </Link>
                ) : (
                  <a href={c.existing.url} target="_blank" rel="noreferrer" className="font-bold text-[#FF9A66] underline">
                    View it
                  </a>
                )}
              </li>
            ))}
            {issues.map((i, n) => (
              <li key={`i${n}`}>• {i.message}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> Passes every guardrail
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Fields */}
        <div className="min-w-0 space-y-6">
          <Card title="Page">
            <div>
              <Label>Title (H1)</Label>
              <input value={fields.title} onChange={(e) => set('title', e.target.value)} className={`${inputClass} ${fieldBorder('title')}`} />
            </div>
            <div>
              <Label
                extra={
                  <button type="button" onClick={() => set('slug', slugify(fields.title))} className="text-xs font-bold text-[#FF9A66] hover:text-white">
                    From title
                  </button>
                }
              >
                Slug
              </Label>
              <div className="flex items-center rounded-lg border border-gray-700 bg-gray-900 focus-within:border-[#F46325]">
                <span className="pl-3 text-sm text-gray-500">/insights/</span>
                <input
                  value={fields.slug}
                  onChange={(e) => set('slug', e.target.value.toLowerCase())}
                  className={`w-full rounded-lg bg-transparent py-2.5 pr-3 text-white focus:outline-none ${fieldBorder('slug')}`}
                />
              </div>
              {status === 'published' && fields.slug !== saved.slug && <p className="mt-1 text-xs text-amber-300">Changing a live page&apos;s slug breaks links to the old URL.</p>}
            </div>
          </Card>

          <Card title="Search">
            <div>
              <Label extra={<Counter value={fields.meta_title} max={META_TITLE_MAX} />}>Meta title</Label>
              <input value={fields.meta_title} onChange={(e) => set('meta_title', e.target.value)} className={`${inputClass} ${fieldBorder('meta_title')}`} />
            </div>
            <div>
              <Label extra={<Counter value={fields.meta_description} max={META_DESCRIPTION_MAX} />}>Meta description</Label>
              <textarea
                value={fields.meta_description}
                onChange={(e) => set('meta_description', e.target.value)}
                rows={3}
                className={`${inputClass} ${fieldBorder('meta_description')}`}
              />
            </div>
            <div>
              <Label>Google preview</Label>
              <SnippetPreview slug={fields.slug} metaTitle={fields.meta_title} metaDescription={fields.meta_description} />
            </div>
            <div>
              <Label>Main keyword</Label>
              <input value={fields.main_keyword} onChange={(e) => set('main_keyword', e.target.value)} className={`${inputClass} ${fieldBorder('main_keyword')}`} />
            </div>
            <div>
              <Label>Secondary keywords (comma separated)</Label>
              <input
                value={secondaryText}
                onChange={(e) => {
                  setSecondaryText(e.target.value);
                  set(
                    'secondary_keywords',
                    e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  );
                }}
                className={`${inputClass} ${fieldBorder('secondary_keywords')}`}
              />
            </div>
          </Card>

          <Card title="Body">
            <div>
              <Label
                extra={
                  <span className={`text-xs font-bold tabular-nums ${words < MIN_BODY_WORDS ? 'text-red-400' : 'text-gray-500'}`}>
                    {words} words (min {MIN_BODY_WORDS})
                  </span>
                }
              >
                Markdown
              </Label>
              <textarea
                value={fields.body}
                onChange={(e) => set('body', e.target.value)}
                rows={28}
                spellCheck
                className={`${inputClass} font-mono text-sm leading-relaxed ${fieldBorder('body')}`}
                placeholder={'Opening paragraph that answers the question.\n\n## A question people ask\n\nThe answer…'}
              />
              <p className="mt-1 text-xs text-gray-500">## sections, **bold**, *italic*, [links](https://…), - lists, &gt; quotes, | tables |. No images or HTML.</p>
            </div>
          </Card>

          <Card title="FAQ">
            <FaqEditor value={fields.faq} onChange={(v) => set('faq', v)} />
          </Card>

          <Card title="Source videos">
            <p className="-mt-2 text-sm text-gray-400">Check the page against what the creator actually said.</p>
            <VideoList value={fields.source_videos} onChange={(v) => set('source_videos', v)} />
          </Card>

          <Card title="Schema JSON-LD">
            <p className="-mt-2 text-sm text-gray-400">Leave empty to generate Article + FAQPage schema from the page.</p>
            <textarea
              value={fields.schema_jsonld}
              onChange={(e) => set('schema_jsonld', e.target.value)}
              rows={8}
              className={`${inputClass} font-mono text-xs ${fieldBorder('schema_jsonld')}`}
              placeholder='{ "@context": "https://schema.org", … }'
            />
          </Card>
        </div>

        {/* Preview / history */}
        <div className="min-w-0">
          <div className="sticky top-40">
            <div className="mb-3 flex gap-2">
              <button type="button" onClick={() => setPane('preview')} className={`${btn} ${pane === 'preview' ? 'bg-[#F46325] text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                <Eye className="h-4 w-4" /> Live preview
              </button>
              {loaded && (
                <button type="button" onClick={() => setPane('history')} className={`${btn} ${pane === 'history' ? 'bg-[#F46325] text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                  <History className="h-4 w-4" /> History <span className="opacity-70">{loaded.revisions.length}</span>
                </button>
              )}
            </div>
            {pane === 'preview' || !loaded ? (
              <div className="max-h-[calc(100vh-13rem)] overflow-y-auto overflow-x-hidden rounded-xl border border-gray-700">
                <InsightArticle
                  compact
                  title={fields.title}
                  lede={fields.meta_description}
                  body={fields.body}
                  faq={fields.faq.filter((f) => f.question || f.answer)}
                  publishedAt={page?.published_at}
                  cta={<span className="btn btn-solid">Let&apos;s talk</span>}
                />
              </div>
            ) : (
              <div className="max-h-[calc(100vh-13rem)] overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-4">
                <p className="mb-3 text-sm text-gray-400">Every save and status change. Open one to see what changed and restore it.</p>
                <HistoryPanel pageId={id} revisions={loaded.revisions} onRestored={(d) => (show(d as Loaded), setPane('preview'), setNotice('Version restored as a new save.'))} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
