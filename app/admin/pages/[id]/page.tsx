'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Archive, Bot, CheckCircle2, Eye, History, RotateCcw, Save, Send, ThumbsDown, Undo2 } from 'lucide-react';
import { Badge, Button, Card, Notice, PageHeader, useConfirm } from '@taam/crm/client';
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
import { Tabs } from '../../components/crm-ui';
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

function Label({ children, extra, htmlFor }: { children: React.ReactNode; extra?: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-sm font-medium text-[var(--crm-ink)]">
        {children}
      </label>
      {extra}
    </div>
  );
}

/** A section of the editor: the CRM's card with its fields spaced the same way everywhere. */
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Card title={title} subtitle={subtitle}>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

export default function PageEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === 'new';
  const router = useRouter();
  const confirm = useConfirm();

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
    if (action === 'unpublish' && !(await confirm({ title: 'Take this page off the site?', body: 'It goes back to draft and leaves the sitemap.', confirmLabel: 'Unpublish' })))
      return;
    if (action === 'archive' && !(await confirm({ title: 'Archive this page?', body: 'You can restore it any time.', confirmLabel: 'Archive' }))) return;
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
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Page not found" breadcrumbs={[{ label: 'SEO pages', href: '/pages' }, { label: 'Page' }]} />
        <Notice tone="bad" title="Could not load this page">
          {loadError}
        </Notice>
      </div>
    );
  }
  if (!isNew && !loaded) {
    return (
      <div className="mx-auto max-w-7xl space-y-4" aria-busy="true" aria-label="Loading page">
        <div className="crm-skeleton h-4 w-24 rounded" />
        <div className="crm-skeleton h-8 w-2/3 rounded" />
        <div className="grid gap-6 pt-4 xl:grid-cols-2">
          <div className="crm-skeleton h-72 rounded-xl" />
          <div className="crm-skeleton h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  const page = loaded?.page;
  const status = page?.status ?? 'draft';
  const blockers = issues.length + conflicts.length;
  const fieldIssues = (f: keyof PageFields) => issues.filter((i) => i.field === f);
  const fieldBorder = (f: keyof PageFields) => (fieldIssues(f).length || conflicts.some((c) => c.field === f) ? '!border-[var(--crm-bad)]' : '');
  const invalid = (f: keyof PageFields) => (fieldBorder(f) ? true : undefined);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header + actions stay in view while the long form scrolls. */}
      <div className="z-20 -mx-1 mb-6 border-b lg:sticky lg:top-0 border-[var(--crm-line)] bg-[var(--crm-bg)] px-1 pt-1">
        <PageHeader
          title={fields.title || (isNew ? 'New page' : 'Untitled')}
          breadcrumbs={[{ label: 'SEO pages', href: '/pages' }, { label: isNew ? 'New page' : 'Edit page' }]}
          meta={
            <>
              {page && <PageStatusBadge status={status} />}
              {dirty && <Badge tone="warn">Unsaved changes</Badge>}
            </>
          }
          subtitle={
            page ? (
              <span className="inline-flex flex-wrap items-center gap-x-1.5">
                {page.created_by_kind === 'claude' && <Bot className="size-3.5" aria-hidden />}
                {page.created_by_kind === 'claude' ? 'Claude weekly run' : page.created_by} · created {when(page.created_at)}
                {page.published_at && ` · published ${when(page.published_at)}`}
              </span>
            ) : undefined
          }
          actions={
            <>
              {loaded && (
                <a
                  href={loaded.preview_path}
                  target="_blank"
                  rel="noreferrer"
                  title={dirty ? 'Shows the last saved version' : undefined}
                  className="inline-flex min-h-10 items-center gap-2 rounded-[var(--crm-radius-control)] px-3 text-sm font-semibold text-[var(--crm-muted)] transition-colors hover:text-[var(--crm-ink)]"
                >
                  <Eye className="size-4" aria-hidden /> Preview
                </a>
              )}
              {page && status === 'archived' && (
                <Button variant="secondary" onClick={() => act('restore')} disabled={!!busy} busy={busy === 'restore'}>
                  <RotateCcw className="size-4" aria-hidden /> Restore
                </Button>
              )}
              {page && status !== 'archived' && (
                <Button variant="ghost" onClick={() => act('archive')} disabled={!!busy} busy={busy === 'archive'}>
                  <Archive className="size-4" aria-hidden /> Archive
                </Button>
              )}
              {page && status !== 'archived' && status !== 'published' && (
                <Button variant="ghost" onClick={() => setRejecting((r) => !r)} disabled={!!busy} aria-expanded={rejecting}>
                  <ThumbsDown className="size-4" aria-hidden /> Reject
                </Button>
              )}
              {page && status === 'published' && (
                <Button variant="secondary" onClick={() => act('unpublish')} disabled={!!busy} busy={busy === 'unpublish'}>
                  <Undo2 className="size-4" aria-hidden /> Unpublish
                </Button>
              )}
              {status !== 'archived' && (
                <Button
                  variant={status === 'published' || isNew ? 'primary' : 'secondary'}
                  onClick={save}
                  disabled={!!busy || (!dirty && !isNew) || blockers > 0}
                  busy={busy === 'save'}
                  busyLabel="Saving…"
                >
                  <Save className="size-4" aria-hidden /> {status === 'published' ? 'Save live page' : 'Save draft'}
                </Button>
              )}
              {page && (status === 'draft' || status === 'needs_review') && (
                <Button variant="primary" onClick={() => act('publish')} disabled={!!busy || blockers > 0} busy={busy === 'publish'} busyLabel="Publishing…">
                  <Send className="size-4" aria-hidden /> Publish
                </Button>
              )}
            </>
          }
        />

        {(rejecting || error || (notice && !error)) && (
          <div className="mb-4 space-y-3">
            {rejecting && (
              <div className="rounded-[var(--crm-radius)] border border-[var(--crm-line)] bg-[var(--crm-surface)] p-4">
                <Label htmlFor="reject-note">Why is this page rejected? Claude reads this before suggesting new pages.</Label>
                <textarea
                  id="reject-note"
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  rows={2}
                  placeholder='e.g. "Off-topic for our clients", "Says the creator recommends X, he said the opposite at 4:10"'
                  className={inputClass}
                />
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setRejecting(false)}>
                    Cancel
                  </Button>
                  <Button variant="danger" onClick={() => act('reject', rejectNote)} disabled={!rejectNote.trim() || !!busy} busy={busy === 'reject'}>
                    <ThumbsDown className="size-4" aria-hidden /> Reject and archive
                  </Button>
                </div>
              </div>
            )}
            {error && (
              <Notice tone="bad" onDismiss={() => setError('')}>
                {error}
              </Notice>
            )}
            {notice && !error && (
              <Notice tone="ok" onDismiss={() => setNotice('')}>
                {notice}
              </Notice>
            )}
          </div>
        )}
      </div>

      {page?.rejection_note && (
        <div className="mb-6">
          <Notice tone="bad" title={`Rejected ${when(page.rejected_at)}`}>
            {page.rejection_note}
          </Notice>
        </div>
      )}

      {/* Guardrails */}
      <div className="mb-6">
        {blockers > 0 ? (
          <Notice tone="warn" title={`Fix before saving (${blockers})`}>
            <ul className="list-disc space-y-1 pl-4">
              {conflicts.map((c, i) => (
                <li key={`c${i}`}>
                  {c.message}{' '}
                  {c.existing.kind === 'insight' && c.existing.id ? (
                    <Link href={`/admin/pages/${c.existing.id}`} className="font-semibold text-[var(--crm-brand-ink)] underline underline-offset-2">
                      Open that page
                    </Link>
                  ) : (
                    <a href={c.existing.url} target="_blank" rel="noreferrer" className="font-semibold text-[var(--crm-brand-ink)] underline underline-offset-2">
                      View it
                    </a>
                  )}
                </li>
              ))}
              {issues.map((i, n) => (
                <li key={`i${n}`}>{i.message}</li>
              ))}
            </ul>
          </Notice>
        ) : (
          <p className="inline-flex items-center gap-2 text-sm font-medium text-[var(--crm-ok)]">
            <CheckCircle2 className="size-4" aria-hidden /> Passes every guardrail
          </p>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Fields */}
        <div className="min-w-0 space-y-6">
          <Section title="Page">
            <div>
              <Label htmlFor="f-title">Title (H1)</Label>
              <input id="f-title" value={fields.title} onChange={(e) => set('title', e.target.value)} aria-invalid={invalid('title')} className={`${inputClass} ${fieldBorder('title')}`} />
            </div>
            <div>
              <Label
                htmlFor="f-slug"
                extra={
                  <button type="button" onClick={() => set('slug', slugify(fields.title))} className="text-xs font-semibold text-[var(--crm-brand-ink)] hover:text-[var(--crm-ink)]">
                    Make from title
                  </button>
                }
              >
                Slug
              </Label>
              <div
                className={`flex min-h-10 items-center rounded-[var(--crm-radius-control)] border border-[var(--crm-field)] bg-[var(--crm-raised)] transition-colors focus-within:border-[var(--crm-brand)] ${fieldBorder('slug')}`}
              >
                <span className="pl-3 text-sm text-[var(--crm-muted)]">/insights/</span>
                <input
                  id="f-slug"
                  value={fields.slug}
                  onChange={(e) => set('slug', e.target.value.toLowerCase())}
                  aria-invalid={invalid('slug')}
                  className="w-full bg-transparent py-2 pr-3 text-base text-[var(--crm-ink)] focus:outline-none sm:text-sm"
                />
              </div>
              {status === 'published' && fields.slug !== saved.slug && (
                <p className="mt-1 text-xs text-[var(--crm-warn)]">Changing a live page&apos;s slug breaks links to the old URL.</p>
              )}
            </div>
          </Section>

          <Section title="Search">
            <div>
              <Label htmlFor="f-meta-title" extra={<Counter value={fields.meta_title} max={META_TITLE_MAX} />}>
                Meta title
              </Label>
              <input
                id="f-meta-title"
                value={fields.meta_title}
                onChange={(e) => set('meta_title', e.target.value)}
                aria-invalid={invalid('meta_title')}
                className={`${inputClass} ${fieldBorder('meta_title')}`}
              />
            </div>
            <div>
              <Label htmlFor="f-meta-desc" extra={<Counter value={fields.meta_description} max={META_DESCRIPTION_MAX} />}>
                Meta description
              </Label>
              <textarea
                id="f-meta-desc"
                value={fields.meta_description}
                onChange={(e) => set('meta_description', e.target.value)}
                rows={3}
                aria-invalid={invalid('meta_description')}
                className={`${inputClass} ${fieldBorder('meta_description')}`}
              />
            </div>
            <div>
              <Label>Google preview</Label>
              <SnippetPreview slug={fields.slug} metaTitle={fields.meta_title} metaDescription={fields.meta_description} />
            </div>
            <div>
              <Label htmlFor="f-keyword">Main keyword</Label>
              <input
                id="f-keyword"
                value={fields.main_keyword}
                onChange={(e) => set('main_keyword', e.target.value)}
                aria-invalid={invalid('main_keyword')}
                className={`${inputClass} ${fieldBorder('main_keyword')}`}
              />
            </div>
            <div>
              <Label htmlFor="f-secondary">Secondary keywords</Label>
              <input
                id="f-secondary"
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
                aria-invalid={invalid('secondary_keywords')}
                className={`${inputClass} ${fieldBorder('secondary_keywords')}`}
              />
              <p className="mt-1 text-xs text-[var(--crm-muted)]">Separate them with commas.</p>
            </div>
          </Section>

          <Section title="Body">
            <div>
              <Label
                htmlFor="f-body"
                extra={
                  <span className={`text-xs font-medium tabular-nums ${words < MIN_BODY_WORDS ? 'text-[var(--crm-bad)]' : 'text-[var(--crm-muted)]'}`}>
                    {words} words (min {MIN_BODY_WORDS})
                  </span>
                }
              >
                Markdown
              </Label>
              <textarea
                id="f-body"
                value={fields.body}
                onChange={(e) => set('body', e.target.value)}
                rows={28}
                spellCheck
                aria-invalid={invalid('body')}
                className={`${inputClass} font-mono text-sm leading-relaxed ${fieldBorder('body')}`}
                placeholder={'Opening paragraph that answers the question.\n\n## A question people ask\n\nThe answer…'}
              />
              <p className="mt-1 text-xs text-[var(--crm-muted)]">## sections, **bold**, *italic*, [links](https://…), - lists, &gt; quotes, | tables |. No images or HTML.</p>
            </div>
          </Section>

          <Section title="FAQ">
            <FaqEditor value={fields.faq} onChange={(v) => set('faq', v)} />
          </Section>

          <Section title="Source videos" subtitle="Check the page against what the creator actually said.">
            <VideoList value={fields.source_videos} onChange={(v) => set('source_videos', v)} />
          </Section>

          <Section title="Schema JSON-LD" subtitle="Leave empty to generate Article + FAQPage schema from the page.">
            <textarea
              value={fields.schema_jsonld}
              onChange={(e) => set('schema_jsonld', e.target.value)}
              rows={8}
              aria-label="Schema JSON-LD"
              aria-invalid={invalid('schema_jsonld')}
              className={`${inputClass} font-mono text-xs ${fieldBorder('schema_jsonld')}`}
              placeholder='{ "@context": "https://schema.org", … }'
            />
          </Section>
        </div>

        {/* Preview / history */}
        <div className="min-w-0">
          <div className="xl:sticky xl:top-48">
            <Tabs
              label="Right panel"
              value={loaded ? pane : 'preview'}
              onChange={setPane}
              options={[
                { value: 'preview', label: 'Live preview' },
                ...(loaded ? [{ value: 'history' as const, label: 'History', count: loaded.revisions.length }] : []),
              ]}
            />
            {pane === 'preview' || !loaded ? (
              <div className="max-h-[calc(100vh-15rem)] overflow-y-auto overflow-x-hidden rounded-[var(--crm-radius)] border border-[var(--crm-line)]">
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
              <Card>
                <p className="mb-3 flex items-center gap-2 text-sm text-[var(--crm-muted)]">
                  <History className="size-4" aria-hidden /> Every save and status change. Open one to see what changed and restore it.
                </p>
                <div className="max-h-[calc(100vh-19rem)] overflow-y-auto">
                  <HistoryPanel pageId={id} revisions={loaded.revisions} onRestored={(d) => (show(d as Loaded), setPane('preview'), setNotice('Version restored as a new save.'))} />
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
