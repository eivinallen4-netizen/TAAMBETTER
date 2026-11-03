// SEO pages (/insights/[slug]): the field shapes and the guardrails every write goes through.
// Pure and client-safe, so the admin editor shows the exact same warnings live that the server
// enforces on save, and the MCP tools (lib/crm/operations.ts) and the admin API (app/api/admin/pages)
// can't disagree. The duplicate slug / keyword checks need the database and live in lib/pages/store.ts.

export const PAGE_STATUSES = ['draft', 'needs_review', 'published', 'archived'] as const;
export type PageStatus = (typeof PAGE_STATUSES)[number];

export const STATUS_LABEL: Record<PageStatus, string> = {
  draft: 'Draft',
  needs_review: 'Needs review',
  published: 'Published',
  archived: 'Archived',
};

export const META_TITLE_MAX = 60;
export const META_DESCRIPTION_MAX = 160;
export const MIN_BODY_WORDS = 600;

/** /insights/preview/[token] is a route, so no page can take the slug "preview". */
const RESERVED_SLUGS = new Set(['preview']);

export interface FaqItem {
  question: string;
  answer: string;
}

/** The fields a person or Claude writes. Everything else on a page is bookkeeping. */
export interface PageFields {
  slug: string;
  title: string;
  meta_title: string;
  meta_description: string;
  main_keyword: string;
  secondary_keywords: string[];
  body: string;
  faq: FaqItem[];
  schema_jsonld: string;
  source_videos: string[];
}

export const PAGE_FIELDS: (keyof PageFields)[] = [
  'slug',
  'title',
  'meta_title',
  'meta_description',
  'main_keyword',
  'secondary_keywords',
  'body',
  'faq',
  'schema_jsonld',
  'source_videos',
];

export const FIELD_LABEL: Record<keyof PageFields, string> = {
  slug: 'Slug',
  title: 'Title',
  meta_title: 'Meta title',
  meta_description: 'Meta description',
  main_keyword: 'Main keyword',
  secondary_keywords: 'Secondary keywords',
  body: 'Body',
  faq: 'FAQ',
  schema_jsonld: 'Schema JSON-LD',
  source_videos: 'Source videos',
};

export interface PageIssue {
  field: keyof PageFields;
  message: string;
}

export const emptyPageFields = (): PageFields => ({
  slug: '',
  title: '',
  meta_title: '',
  meta_description: '',
  main_keyword: '',
  secondary_keywords: [],
  body: '',
  faq: [],
  schema_jsonld: '',
  source_videos: [],
});

// ---------- Normalizing input ----------

const text = (v: unknown, max: number) => (v == null ? '' : String(v).trim().slice(0, max));

function list(v: unknown, max: number): string[] {
  const items = Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[\n,]/) : [];
  return items.map((s) => text(s, max)).filter(Boolean).slice(0, 50);
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

/** Keywords compare case- and spacing-insensitively. */
export const keywordKey = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Coerces one field from whatever the caller sent (MCP JSON, the admin form) into its stored shape.
 * Lengths are capped generously here; the real limits are reported by checkPageFields, not silently cut.
 */
export function normalizeField<K extends keyof PageFields>(field: K, value: unknown): PageFields[K] {
  switch (field) {
    case 'slug':
      return text(value, 200).toLowerCase() as PageFields[K];
    case 'secondary_keywords':
      return list(value, 120) as PageFields[K];
    case 'source_videos':
      return list(value, 500) as PageFields[K];
    case 'faq': {
      const items = Array.isArray(value) ? value : [];
      return items
        .map((f) => {
          const o = (f ?? {}) as Record<string, unknown>;
          return { question: text(o.question ?? o.q, 500), answer: text(o.answer ?? o.a, 4000) };
        })
        .filter((f) => f.question || f.answer)
        .slice(0, 30) as PageFields[K];
    }
    case 'schema_jsonld':
      if (value && typeof value === 'object') return JSON.stringify(value, null, 2) as PageFields[K];
      return text(value, 50_000) as PageFields[K];
    case 'body':
      return (value == null ? '' : String(value).replace(/\r\n/g, '\n').trim().slice(0, 200_000)) as PageFields[K];
    default:
      return text(value, 1000) as PageFields[K];
  }
}

/** Only the fields present in `input` (for partial updates). */
export function pickPageFields(input: Record<string, unknown>): Partial<PageFields> {
  const out: Partial<PageFields> = {};
  for (const f of PAGE_FIELDS) {
    if (input[f] !== undefined) (out as Record<string, unknown>)[f] = normalizeField(f, input[f]);
  }
  return out;
}

// ---------- Checks ----------

/** TAAM never discounts (CLAUDE.md). "sales" (revenue) is fine; "sale" (a price cut) is not. */
const BANNED: { label: string; re: RegExp }[] = [
  { label: 'discount', re: /\bdiscount(s|ed|ing)?\b/i },
  { label: 'deal', re: /\bdeals?\b/i },
  { label: 'sale', re: /\bsale\b/i },
  { label: 'coupon', re: /\bcoupons?\b/i },
  { label: '% off', re: /%\s*off\b|\bpercent\s+off\b/i },
  { label: 'save', re: /\b(save|saves|saved|saving|savings)\b/i },
  { label: 'promo code', re: /\bpromo(tional)?\s*codes?\b/i },
  { label: 'crossed-out price', re: /~~[^~]*\$\s?\d[^~]*~~/ },
];

/** The banned phrases found in a piece of text, by label. */
export function bannedWordsIn(s: string): string[] {
  return BANNED.filter((b) => b.re.test(s)).map((b) => b.label);
}

/** Words in a Markdown body, ignoring the syntax and link targets. */
export function countWords(markdown: string): number {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|-]+/g, ' ');
  return plain.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;
}

const YOUTUBE_RE = /^https:\/\/(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/|live\/)|youtu\.be\/)[\w-]{6,}/i;

/** Every rule that doesn't need the database. An empty list means the page can be saved. */
export function checkPageFields(p: PageFields): PageIssue[] {
  const issues: PageIssue[] = [];
  const add = (field: keyof PageFields, message: string) => issues.push({ field, message });

  for (const f of ['title', 'slug', 'meta_title', 'meta_description', 'main_keyword', 'body'] as const) {
    if (!p[f]) add(f, `${FIELD_LABEL[f]} is required`);
  }

  if (p.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug)) add('slug', 'Slug can only use lowercase letters, numbers and single hyphens');
  if (p.slug.length > 100) add('slug', 'Slug must be 100 characters or fewer');
  if (RESERVED_SLUGS.has(p.slug)) add('slug', `"${p.slug}" is reserved`);

  if (p.meta_title.length > META_TITLE_MAX) add('meta_title', `Meta title is ${p.meta_title.length} characters (max ${META_TITLE_MAX})`);
  if (p.meta_description.length > META_DESCRIPTION_MAX)
    add('meta_description', `Meta description is ${p.meta_description.length} characters (max ${META_DESCRIPTION_MAX})`);
  if (p.title.length > 200) add('title', 'Title must be 200 characters or fewer');
  if (p.main_keyword.length > 120) add('main_keyword', 'Main keyword must be 120 characters or fewer');

  const words = countWords(p.body);
  if (p.body && words < MIN_BODY_WORDS) add('body', `Body is ${words} words (min ${MIN_BODY_WORDS})`);

  p.faq.forEach((f, i) => {
    if (!f.question || !f.answer) add('faq', `FAQ ${i + 1} needs both a question and an answer`);
  });

  if (p.schema_jsonld) {
    try {
      const parsed = JSON.parse(p.schema_jsonld);
      if (!parsed || typeof parsed !== 'object') add('schema_jsonld', 'Schema JSON-LD must be a JSON object or array');
    } catch {
      add('schema_jsonld', 'Schema JSON-LD is not valid JSON');
    }
  }

  p.source_videos.forEach((u) => {
    if (!YOUTUBE_RE.test(u)) add('source_videos', `Not a YouTube video URL: ${u}`);
  });

  const scanned: [keyof PageFields, string][] = [
    ['title', p.title],
    ['slug', p.slug.replace(/-/g, ' ')],
    ['meta_title', p.meta_title],
    ['meta_description', p.meta_description],
    ['main_keyword', p.main_keyword],
    ['secondary_keywords', p.secondary_keywords.join(' | ')],
    ['body', p.body],
    ['faq', p.faq.map((f) => `${f.question} ${f.answer}`).join(' | ')],
    ['schema_jsonld', p.schema_jsonld],
  ];
  for (const [field, value] of scanned) {
    const found = bannedWordsIn(value);
    if (found.length) add(field, `${FIELD_LABEL[field]} uses banned wording (TAAM never discounts): ${found.map((w) => `"${w}"`).join(', ')}`);
  }

  return issues;
}
