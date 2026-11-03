import { randomBytes, randomUUID } from 'crypto';
import type { Client, Row } from '@libsql/client';
import { revalidatePath } from 'next/cache';
import { SITE_URL } from '@/lib/site-url';
import {
  PAGE_FIELDS,
  PAGE_STATUSES,
  checkPageFields,
  emptyPageFields,
  keywordKey,
  pickPageFields,
  type FaqItem,
  type PageFields,
  type PageIssue,
  type PageStatus,
} from './rules';
import { sitePages } from './site-pages';

// SEO pages published at /insights/[slug]. Claude drafts them through the MCP tools (create_page
// etc. in lib/crm/operations.ts), the team reviews and publishes them at /admin/pages. Both go
// through the functions here, so the guardrails (lib/pages/rules.ts + the duplicate checks below)
// run on every write whichever side it comes from. Pages are never hard-deleted: archive is the
// delete, and every save and status change lands in page_revisions.

export interface Actor {
  name: string;
  /** 'claude' for MCP / API calls, 'team' for someone logged in to the admin. */
  kind: 'claude' | 'team';
}

export interface Page extends PageFields {
  id: string;
  status: PageStatus;
  created_by: string;
  created_by_kind: Actor['kind'];
  rejection_note: string;
  rejected_at: string | null;
  preview_token: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  archived_at: string | null;
}

export interface PageConflict {
  field: 'slug' | 'main_keyword';
  message: string;
  existing: { id: string | null; slug: string; title: string; status: string; url: string; kind: 'insight' | 'hand-built' };
}

export class PageError extends Error {
  constructor(
    public status: number,
    message: string,
    public issues: PageIssue[] = [],
    public conflicts: PageConflict[] = []
  ) {
    super(message);
  }
}

export async function initPagesTables(db: Client): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      meta_title TEXT NOT NULL,
      meta_description TEXT NOT NULL,
      main_keyword TEXT NOT NULL,
      main_keyword_key TEXT NOT NULL,
      secondary_keywords TEXT NOT NULL DEFAULT '[]',
      body TEXT NOT NULL,
      faq TEXT NOT NULL DEFAULT '[]',
      schema_jsonld TEXT,
      source_videos TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'needs_review',
      created_by TEXT,
      created_by_kind TEXT,
      rejection_note TEXT,
      rejected_at TEXT,
      preview_token TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      published_at TEXT,
      archived_at TEXT
    )
  `);
  await db.execute('CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_pages_keyword ON pages(main_keyword_key)');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS page_revisions (
      id TEXT PRIMARY KEY,
      page_id TEXT NOT NULL,
      action TEXT NOT NULL,
      changed_fields TEXT NOT NULL DEFAULT '[]',
      snapshot TEXT NOT NULL,
      note TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL
    )
  `);
  await db.execute('CREATE INDEX IF NOT EXISTS idx_page_revisions_page ON page_revisions(page_id, created_at)');
}

// ---------- Reading ----------

const parseJson = <T>(v: unknown, fallback: T): T => {
  try {
    return v == null || v === '' ? fallback : (JSON.parse(String(v)) as T);
  } catch {
    return fallback;
  }
};
const s = (v: unknown) => (v == null ? '' : String(v));
const sOrNull = (v: unknown) => (v == null ? null : String(v));

function toPage(r: Row): Page {
  return {
    id: s(r.id),
    slug: s(r.slug),
    title: s(r.title),
    meta_title: s(r.meta_title),
    meta_description: s(r.meta_description),
    main_keyword: s(r.main_keyword),
    secondary_keywords: parseJson<string[]>(r.secondary_keywords, []),
    body: s(r.body),
    faq: parseJson<FaqItem[]>(r.faq, []),
    schema_jsonld: s(r.schema_jsonld),
    source_videos: parseJson<string[]>(r.source_videos, []),
    status: (PAGE_STATUSES as readonly string[]).includes(s(r.status)) ? (s(r.status) as PageStatus) : 'draft',
    created_by: s(r.created_by),
    created_by_kind: r.created_by_kind === 'claude' ? 'claude' : 'team',
    rejection_note: s(r.rejection_note),
    rejected_at: sOrNull(r.rejected_at),
    preview_token: s(r.preview_token),
    created_at: s(r.created_at),
    updated_at: s(r.updated_at),
    published_at: sOrNull(r.published_at),
    archived_at: sOrNull(r.archived_at),
  };
}

export const publicPageUrl = (slug: string) => `${SITE_URL}/insights/${slug}`;
export const previewPath = (token: string) => `/insights/preview/${token}`;

export const pageFieldsOf = (p: PageFields): PageFields => Object.fromEntries(PAGE_FIELDS.map((f) => [f, p[f]])) as unknown as PageFields;

export async function getPageById(db: Client, id: string): Promise<Page | null> {
  const r = await db.execute({ sql: 'SELECT * FROM pages WHERE id = ?', args: [id] });
  return r.rows[0] ? toPage(r.rows[0]) : null;
}

export async function getPageBySlug(db: Client, slug: string): Promise<Page | null> {
  const r = await db.execute({ sql: 'SELECT * FROM pages WHERE slug = ?', args: [slug.trim().toLowerCase()] });
  return r.rows[0] ? toPage(r.rows[0]) : null;
}

export async function getPageByToken(db: Client, token: string): Promise<Page | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const r = await db.execute({ sql: 'SELECT * FROM pages WHERE preview_token = ?', args: [token] });
  return r.rows[0] ? toPage(r.rows[0]) : null;
}

/** Live pages for /insights and the sitemap. */
export async function listPublishedPages(db: Client): Promise<Pick<Page, 'slug' | 'title' | 'updated_at' | 'published_at'>[]> {
  const r = await db.execute("SELECT slug, title, updated_at, published_at FROM pages WHERE status = 'published' ORDER BY published_at DESC");
  return r.rows.map((row) => ({ slug: s(row.slug), title: s(row.title), updated_at: s(row.updated_at), published_at: sOrNull(row.published_at) }));
}

export type PageSummary = Omit<Page, 'body' | 'faq' | 'schema_jsonld' | 'preview_token'> & { word_count?: number };

export async function listPages(
  db: Client,
  opts: { status?: string; query?: string; sort?: 'newest' | 'oldest' | 'updated' | 'published'; limit?: number } = {}
): Promise<{ data: PageSummary[]; counts: Record<PageStatus, number> }> {
  const status = (PAGE_STATUSES as readonly string[]).includes(opts.status ?? '') ? opts.status! : '';
  const query = (opts.query ?? '').trim().slice(0, 100);
  const like = `%${query}%`;
  const order = {
    newest: 'created_at DESC',
    oldest: 'created_at ASC',
    updated: 'updated_at DESC',
    published: 'published_at IS NULL, published_at DESC',
  }[opts.sort ?? 'newest'];
  const [result, counts] = await Promise.all([
    db.execute({
      sql: `SELECT * FROM pages WHERE (? = '' OR status = ?) AND (? = '' OR title LIKE ? OR main_keyword LIKE ? OR slug LIKE ? OR secondary_keywords LIKE ?)
            ORDER BY ${order} LIMIT ?`,
      args: [status, status, query, like, like, like, like, Math.max(1, Math.min(1000, opts.limit ?? 500))],
    }),
    db.execute('SELECT status, COUNT(*) AS n FROM pages GROUP BY status'),
  ]);
  const byStatus = Object.fromEntries(PAGE_STATUSES.map((st) => [st, 0])) as Record<PageStatus, number>;
  for (const row of counts.rows) if (s(row.status) in byStatus) byStatus[s(row.status) as PageStatus] = Number(row.n);
  return {
    data: result.rows.map((row) => {
      const { body, faq, schema_jsonld, preview_token, ...rest } = toPage(row);
      void body;
      void faq;
      void schema_jsonld;
      void preview_token;
      return rest;
    }),
    counts: byStatus,
  };
}

export async function countNeedsReview(db: Client): Promise<number> {
  const r = await db.execute("SELECT COUNT(*) AS n FROM pages WHERE status = 'needs_review'");
  return Number(r.rows[0]?.n ?? 0);
}

// ---------- Guardrails ----------

/** Slug taken by any page (archived included: slugs are forever), or main keyword owned by a live / draft page or a hand-built page. */
export async function findConflicts(db: Client, p: Pick<PageFields, 'slug' | 'main_keyword'>, excludeId?: string): Promise<PageConflict[]> {
  const conflicts: PageConflict[] = [];
  const key = keywordKey(p.main_keyword);
  const r = await db.execute({
    sql: `SELECT id, slug, title, status, main_keyword_key FROM pages
          WHERE id != ? AND (slug = ? OR (main_keyword_key = ? AND status != 'archived'))`,
    args: [excludeId ?? '', p.slug, key],
  });
  for (const row of r.rows) {
    const existing = { id: s(row.id), slug: s(row.slug), title: s(row.title), status: s(row.status), url: publicPageUrl(s(row.slug)), kind: 'insight' as const };
    if (p.slug && existing.slug === p.slug) conflicts.push({ field: 'slug', message: `Slug "${p.slug}" is already used by "${existing.title}" (${existing.status})`, existing });
    if (key && s(row.main_keyword_key) === key && existing.status !== 'archived')
      conflicts.push({ field: 'main_keyword', message: `Main keyword "${p.main_keyword}" is already targeted by "${existing.title}" (${existing.status})`, existing });
  }
  if (key) {
    const handBuilt = sitePages().find((sp) => keywordKey(sp.main_keyword) === key);
    if (handBuilt)
      conflicts.push({
        field: 'main_keyword',
        message: `Main keyword "${p.main_keyword}" is already targeted by the hand-built page ${handBuilt.path}`,
        existing: { id: null, slug: handBuilt.path, title: handBuilt.title, status: 'published', url: `${SITE_URL}${handBuilt.path === '/' ? '' : handBuilt.path}`, kind: 'hand-built' },
      });
  }
  return conflicts;
}

/** Every guardrail, the same for the admin and MCP. */
export async function validatePage(db: Client, p: PageFields, excludeId?: string): Promise<{ issues: PageIssue[]; conflicts: PageConflict[] }> {
  const issues = checkPageFields(p);
  const conflicts = p.slug || p.main_keyword ? await findConflicts(db, p, excludeId) : [];
  return { issues, conflicts };
}

async function assertValid(db: Client, p: PageFields, excludeId?: string): Promise<void> {
  const { issues, conflicts } = await validatePage(db, p, excludeId);
  if (conflicts.length) throw new PageError(409, conflicts.map((c) => c.message).join('; '), issues, conflicts);
  if (issues.length) throw new PageError(422, issues.map((i) => i.message).join('; '), issues);
}

// ---------- Writing ----------

function revalidateLive(...slugs: string[]) {
  try {
    for (const slug of new Set(slugs.filter(Boolean))) revalidatePath(`/insights/${slug}`);
    revalidatePath('/insights');
    revalidatePath('/sitemap.xml');
  } catch (err) {
    // Outside a request (scripts, tests) there's nothing to revalidate.
    console.warn('Page revalidation skipped:', err instanceof Error ? err.message : err);
  }
}

async function addRevision(db: Client, page: Page, action: string, by: Actor, changed: string[] = [], note = '') {
  await db.execute({
    sql: 'INSERT INTO page_revisions (id, page_id, action, changed_fields, snapshot, note, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [
      randomUUID(),
      page.id,
      action,
      JSON.stringify(changed),
      JSON.stringify({ ...pageFieldsOf(page), status: page.status }),
      note.slice(0, 2000),
      by.name,
      new Date().toISOString(),
    ],
  });
}

const isUniqueViolation = (err: unknown) => err instanceof Error && /UNIQUE constraint failed/i.test(err.message);

/**
 * New page. Never live on creation: Claude's pages start as "needs_review", a team member's as
 * "draft". Throws PageError 409 with the existing page when the slug or main keyword is taken.
 */
export async function createPage(db: Client, input: Record<string, unknown>, by: Actor): Promise<Page> {
  const fields: PageFields = { ...emptyPageFields(), ...pickPageFields(input) };
  await assertValid(db, fields);
  const now = new Date().toISOString();
  const id = randomUUID();
  const status: PageStatus = by.kind === 'claude' ? 'needs_review' : 'draft';
  try {
    await db.execute({
      sql: `INSERT INTO pages (id, slug, title, meta_title, meta_description, main_keyword, main_keyword_key, secondary_keywords, body, faq,
              schema_jsonld, source_videos, status, created_by, created_by_kind, preview_token, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        fields.slug,
        fields.title,
        fields.meta_title,
        fields.meta_description,
        fields.main_keyword,
        keywordKey(fields.main_keyword),
        JSON.stringify(fields.secondary_keywords),
        fields.body,
        JSON.stringify(fields.faq),
        fields.schema_jsonld,
        JSON.stringify(fields.source_videos),
        status,
        by.name,
        by.kind,
        randomBytes(24).toString('base64url'),
        now,
        now,
      ],
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw new PageError(409, `Slug "${fields.slug}" is already used`, [], await findConflicts(db, fields));
    throw err;
  }
  const page = (await getPageById(db, id))!;
  await addRevision(db, page, 'created', by, PAGE_FIELDS.filter((f) => JSON.stringify(page[f]) !== JSON.stringify(emptyPageFields()[f])));
  return page;
}

/** Changes the fields sent; the rest stay. A live page stays live and is revalidated. */
export async function updatePage(db: Client, id: string, input: Record<string, unknown>, by: Actor, opts: { action?: string; note?: string } = {}): Promise<Page> {
  const current = await getPageById(db, id);
  if (!current) throw new PageError(404, 'Page not found');
  const changes = pickPageFields(input);
  const next: PageFields = { ...pageFieldsOf(current), ...changes };
  const changed = PAGE_FIELDS.filter((f) => JSON.stringify(next[f]) !== JSON.stringify(current[f]));
  if (!changed.length) return current;

  await assertValid(db, next, id);
  try {
    await db.execute({
      sql: `UPDATE pages SET slug = ?, title = ?, meta_title = ?, meta_description = ?, main_keyword = ?, main_keyword_key = ?,
              secondary_keywords = ?, body = ?, faq = ?, schema_jsonld = ?, source_videos = ?, updated_at = ? WHERE id = ?`,
      args: [
        next.slug,
        next.title,
        next.meta_title,
        next.meta_description,
        next.main_keyword,
        keywordKey(next.main_keyword),
        JSON.stringify(next.secondary_keywords),
        next.body,
        JSON.stringify(next.faq),
        next.schema_jsonld,
        JSON.stringify(next.source_videos),
        new Date().toISOString(),
        id,
      ],
    });
  } catch (err) {
    if (isUniqueViolation(err)) throw new PageError(409, `Slug "${next.slug}" is already used`, [], await findConflicts(db, next, id));
    throw err;
  }
  const page = (await getPageById(db, id))!;
  await addRevision(db, page, opts.action ?? 'saved', by, changed, opts.note);
  if (page.status === 'published') revalidateLive(page.slug, current.slug);
  return page;
}

export type StatusAction = 'publish' | 'unpublish' | 'archive' | 'restore' | 'reject';

/**
 * publish: checks every guardrail again, then goes live. unpublish: back to draft.
 * archive: the soft delete (restorable). reject: archive with a note that list_pages / get_page
 * hand back to Claude, so later runs know what not to suggest. restore: archived → draft.
 */
export async function changePageStatus(db: Client, id: string, action: StatusAction, by: Actor, note = ''): Promise<Page> {
  const page = await getPageById(db, id);
  if (!page) throw new PageError(404, 'Page not found');
  const now = new Date().toISOString();
  let sql: string;
  let args: (string | null)[];

  switch (action) {
    case 'publish':
      if (page.status === 'published') return page;
      if (page.status === 'archived') throw new PageError(409, 'Restore this page before publishing it');
      await assertValid(db, pageFieldsOf(page), id);
      sql = "UPDATE pages SET status = 'published', published_at = ?, updated_at = ? WHERE id = ?";
      args = [now, now, id];
      break;
    case 'unpublish':
      if (page.status !== 'published') throw new PageError(409, 'Only a published page can be unpublished');
      sql = "UPDATE pages SET status = 'draft', updated_at = ? WHERE id = ?";
      args = [now, id];
      break;
    case 'archive':
      if (page.status === 'archived') return page;
      sql = "UPDATE pages SET status = 'archived', archived_at = ?, updated_at = ? WHERE id = ?";
      args = [now, now, id];
      break;
    case 'reject': {
      const reason = note.trim().slice(0, 2000);
      if (!reason) throw new PageError(400, 'Say why the page is rejected, so future runs can learn from it');
      sql = "UPDATE pages SET status = 'archived', archived_at = ?, rejection_note = ?, rejected_at = ?, updated_at = ? WHERE id = ?";
      args = [now, reason, now, now, id];
      break;
    }
    case 'restore':
      if (page.status !== 'archived') throw new PageError(409, 'Only an archived page can be restored');
      // Its keyword may have been taken while it was archived.
      await assertValid(db, pageFieldsOf(page), id).catch((err) => {
        if (err instanceof PageError && err.conflicts.length) throw err;
      });
      sql = "UPDATE pages SET status = 'draft', archived_at = NULL, updated_at = ? WHERE id = ?";
      args = [now, id];
      break;
    default:
      throw new PageError(400, `Unknown action: ${String(action)}`);
  }

  await db.execute({ sql, args });
  const updated = (await getPageById(db, id))!;
  const label = { publish: 'published', unpublish: 'unpublished', archive: 'archived', restore: 'restored', reject: 'rejected' }[action];
  await addRevision(db, updated, label, by, [], note);
  if (action === 'publish' || page.status === 'published') revalidateLive(updated.slug);
  return updated;
}

// ---------- History ----------

export interface PageRevision {
  id: string;
  action: string;
  changed_fields: string[];
  note: string;
  created_by: string;
  created_at: string;
}

export async function listRevisions(db: Client, pageId: string): Promise<PageRevision[]> {
  const r = await db.execute({
    sql: 'SELECT id, action, changed_fields, note, created_by, created_at FROM page_revisions WHERE page_id = ? ORDER BY created_at DESC',
    args: [pageId],
  });
  return r.rows.map((row) => ({
    id: s(row.id),
    action: s(row.action),
    changed_fields: parseJson<string[]>(row.changed_fields, []),
    note: s(row.note),
    created_by: s(row.created_by),
    created_at: s(row.created_at),
  }));
}

type Snapshot = PageFields & { status: PageStatus };

/** One revision's snapshot and the one before it, for the diff view. */
export async function getRevision(db: Client, pageId: string, revisionId: string): Promise<{ revision: PageRevision; snapshot: Snapshot; previous: Snapshot | null } | null> {
  const r = await db.execute({ sql: 'SELECT * FROM page_revisions WHERE id = ? AND page_id = ?', args: [revisionId, pageId] });
  const row = r.rows[0];
  if (!row) return null;
  const prev = await db.execute({
    sql: 'SELECT snapshot FROM page_revisions WHERE page_id = ? AND created_at < ? ORDER BY created_at DESC LIMIT 1',
    args: [pageId, s(row.created_at)],
  });
  return {
    revision: {
      id: s(row.id),
      action: s(row.action),
      changed_fields: parseJson<string[]>(row.changed_fields, []),
      note: s(row.note),
      created_by: s(row.created_by),
      created_at: s(row.created_at),
    },
    snapshot: parseJson<Snapshot>(row.snapshot, { ...emptyPageFields(), status: 'draft' }),
    previous: prev.rows[0] ? parseJson<Snapshot>(prev.rows[0].snapshot, { ...emptyPageFields(), status: 'draft' }) : null,
  };
}

/** Puts a revision's content back (not its status), as a new save, through the same guardrails. */
export async function restoreRevision(db: Client, pageId: string, revisionId: string, by: Actor): Promise<Page> {
  const found = await getRevision(db, pageId, revisionId);
  if (!found) throw new PageError(404, 'Revision not found');
  const when = new Date(found.revision.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Los_Angeles' });
  return updatePage(db, pageId, pageFieldsOf(found.snapshot) as unknown as Record<string, unknown>, by, {
    action: 'restored version',
    note: `Restored the version ${found.revision.created_by} saved on ${when} PT`,
  });
}

