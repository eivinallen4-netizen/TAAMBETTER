import { randomUUID } from 'crypto';
import type { Client, InStatement } from '@libsql/client';
import { CALL_OUTCOMES, COLDCALL_STATUSES } from './coldcall-shared';

// Website cold-call leads: local businesses with no real website, found and researched by Claude
// (the lead finder) and pushed in through the API, then called and tracked by the team in
// /admin/coldcall. Fields use the lead finder's camelCase names in and out; optional fields that
// aren't set are left out of the response, not sent as null. Every call/message/status change
// lands in coldcall_events, so each lead has a history.

export { CALL_OUTCOMES, COLDCALL_STATUSES };

type Kind = 'text' | 'longtext' | 'float' | 'int' | 'bool';

/** API field → column, type, and whether it's optional (left out when not set). */
const FIELDS: Record<string, { col: string; kind: Kind; optional?: boolean }> = {
  // Business info
  name: { col: 'name', kind: 'text' },
  category: { col: 'category', kind: 'text' },
  group: { col: 'lead_group', kind: 'text' },
  address: { col: 'address', kind: 'text' },
  phone: { col: 'phone', kind: 'text' },
  rating: { col: 'rating', kind: 'float' },
  reviews: { col: 'reviews', kind: 'int' },
  googleUrl: { col: 'google_url', kind: 'text' },
  // Fit and research
  tier: { col: 'tier', kind: 'text' },
  gap: { col: 'gap', kind: 'text' },
  websiteHost: { col: 'website_host', kind: 'text' },
  hook: { col: 'hook', kind: 'longtext' },
  activity: { col: 'activity', kind: 'text' },
  activityNote: { col: 'activity_note', kind: 'longtext' },
  checked: { col: 'checked', kind: 'text' },
  // Contact
  contactName: { col: 'contact_name', kind: 'text' },
  contactRole: { col: 'contact_role', kind: 'text' },
  contactSource: { col: 'contact_source', kind: 'text' },
  contactConfidence: { col: 'contact_confidence', kind: 'text' },
  // Outreach and tracking
  dm: { col: 'dm', kind: 'longtext' },
  dm2: { col: 'dm2', kind: 'longtext' },
  status: { col: 'status', kind: 'text' },
  notes: { col: 'notes', kind: 'longtext' },
  order: { col: 'sort_order', kind: 'int' },
  // Optional
  instagramUrl: { col: 'instagram_url', kind: 'text', optional: true },
  facebookUrl: { col: 'facebook_url', kind: 'text', optional: true },
  gbpClaimed: { col: 'gbp_claimed', kind: 'bool', optional: true },
  lastReviewDays: { col: 'last_review_days', kind: 'int', optional: true },
  source: { col: 'source', kind: 'text', optional: true },
  // Call tracking (set by the team in the CRM, or by log_coldcall)
  followUp: { col: 'follow_up', kind: 'text', optional: true },
};

export const COLDCALL_FIELDS = Object.keys(FIELDS);

/** Changed only when asked (update_tracking), so a re-sync from the lead finder doesn't undo calls. */
const TRACKING_FIELDS = new Set(['status', 'notes', 'order', 'followUp']);

export interface ColdcallEvent {
  id: string;
  type: string;
  outcome: string;
  note: string;
  status: string;
  createdAt: string;
  createdBy: string;
}

export type ColdcallLead = Record<string, unknown> & { id: string; name: string; status: string };

export class ColdcallError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function initColdcallTables(db: Client): Promise<void> {
  const cols = Object.values(FIELDS)
    .filter((f) => f.col !== 'name')
    .map((f) => `${f.col} ${f.kind === 'float' ? 'REAL' : f.kind === 'int' || f.kind === 'bool' ? 'INTEGER' : 'TEXT'}`)
    .join(',\n        ');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS coldcall_leads (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        ${cols},
        match_key TEXT,
        contact_id TEXT,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_contacted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
  `);
  await db.execute('CREATE INDEX IF NOT EXISTS idx_coldcall_leads_key ON coldcall_leads(match_key)');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS coldcall_events (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      type TEXT NOT NULL,
      outcome TEXT,
      note TEXT,
      status TEXT,
      created_at TEXT NOT NULL,
      created_by TEXT
    )
  `);
  await db.execute('CREATE INDEX IF NOT EXISTS idx_coldcall_events_lead ON coldcall_events(lead_id)');
}

// ---------- Parsing ----------

const text = (v: unknown, max: number) => (v == null ? '' : String(v).trim().slice(0, max));

function parseField(field: string, value: unknown): string | number | null {
  const { kind, optional } = FIELDS[field];
  if (value === null || value === undefined || value === '') {
    if (optional) return null;
    return kind === 'float' || kind === 'int' ? 0 : '';
  }
  switch (kind) {
    case 'float': {
      const n = parseFloat(String(value));
      return Number.isFinite(n) ? n : optional ? null : 0;
    }
    case 'int': {
      const n = parseInt(String(value), 10);
      return Number.isFinite(n) ? n : optional ? null : 0;
    }
    case 'bool':
      if (typeof value === 'boolean') return value ? 1 : 0;
      return /^(true|yes|1)$/i.test(String(value).trim()) ? 1 : 0;
    case 'longtext':
      return text(value, 6000);
    default:
      return text(value, field === 'googleUrl' || field.endsWith('Url') ? 1000 : 500);
  }
}

/** The fields present on an input object, parsed. Unknown keys are ignored. */
function pickFields(input: Record<string, unknown>, skip: Set<string> = new Set()): Record<string, string | number | null> {
  const out: Record<string, string | number | null> = {};
  for (const field of COLDCALL_FIELDS) {
    if (skip.has(field) || !(field in input)) continue;
    out[field] = parseField(field, input[field]);
  }
  return out;
}

const digits = (phone: string) => phone.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');

/** Same business = same phone number, or (no phone) same name + address. */
function matchKey(name: string, phone: string, address: string): string {
  const d = digits(phone);
  if (d.length >= 7) return `tel:${d}`;
  return `name:${name.toLowerCase().replace(/[^a-z0-9]/g, '')}|${address.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
}

function toLead(row: Record<string, unknown>): ColdcallLead {
  const lead: Record<string, unknown> = { id: String(row.id) };
  for (const [field, { col, kind, optional }] of Object.entries(FIELDS)) {
    const v = row[col];
    if (v === null || v === undefined) {
      if (optional) continue;
      lead[field] = kind === 'float' || kind === 'int' ? 0 : '';
      continue;
    }
    lead[field] = kind === 'float' || kind === 'int' ? Number(v) : kind === 'bool' ? Number(v) === 1 : String(v);
  }
  if (row.contact_id) lead.contactId = String(row.contact_id);
  lead.attempts = Number(row.attempts ?? 0);
  if (row.last_contacted_at) lead.lastContactedAt = String(row.last_contacted_at);
  lead.createdAt = String(row.created_at);
  lead.updatedAt = String(row.updated_at);
  return lead as ColdcallLead;
}

const SUMMARY_SKIP = new Set(['dm', 'dm2', 'hook', 'activityNote', 'contactSource']);

function summarize(lead: ColdcallLead): ColdcallLead {
  return Object.fromEntries(Object.entries(lead).filter(([k]) => !SUMMARY_SKIP.has(k))) as ColdcallLead;
}

// ---------- Reads ----------

export interface ListOptions {
  search?: string;
  status?: string;
  tier?: string;
  group?: string;
  /** Only leads with a follow-up date on or before this YYYY-MM-DD. */
  dueBy?: string;
  full?: boolean;
  limit?: number;
  offset?: number;
}

export async function listColdcallLeads(db: Client, opts: ListOptions = {}) {
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (opts.search) {
    const like = `%${opts.search}%`;
    where.push('(name LIKE ? OR category LIKE ? OR phone LIKE ? OR address LIKE ? OR contact_name LIKE ? OR notes LIKE ?)');
    args.push(like, like, like, like, like, like);
  }
  if (opts.status) {
    where.push('status = ?');
    args.push(opts.status);
  }
  if (opts.tier) {
    where.push('tier = ?');
    args.push(opts.tier);
  }
  if (opts.group) {
    where.push('lead_group = ?');
    args.push(opts.group);
  }
  if (opts.dueBy) {
    where.push("follow_up IS NOT NULL AND follow_up <> '' AND follow_up <= ?");
    args.push(opts.dueBy);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const limit = Math.max(1, Math.min(1000, opts.limit ?? 500));
  const offset = Math.max(0, opts.offset ?? 0);
  const [count, result] = await Promise.all([
    db.execute({ sql: `SELECT COUNT(*) AS n FROM coldcall_leads ${clause}`, args }),
    db.execute({
      sql: `SELECT * FROM coldcall_leads ${clause}
            ORDER BY CASE WHEN sort_order IS NULL OR sort_order = 0 THEN 1 ELSE 0 END, sort_order, created_at DESC
            LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    }),
  ]);
  const leads = result.rows.map((r) => toLead(r as Record<string, unknown>));
  return { total: Number(count.rows[0]?.n ?? 0), limit, offset, data: opts.full ? leads : leads.map(summarize) };
}

export async function getColdcallLead(db: Client, id: string): Promise<(ColdcallLead & { history: ColdcallEvent[] }) | null> {
  const [lead, events] = await Promise.all([
    db.execute({ sql: 'SELECT * FROM coldcall_leads WHERE id = ?', args: [id] }),
    db.execute({ sql: 'SELECT * FROM coldcall_events WHERE lead_id = ? ORDER BY created_at DESC LIMIT 200', args: [id] }),
  ]);
  if (!lead.rows[0]) return null;
  return {
    ...toLead(lead.rows[0] as Record<string, unknown>),
    history: events.rows.map((e) => ({
      id: String(e.id),
      type: String(e.type),
      outcome: e.outcome == null ? '' : String(e.outcome),
      note: e.note == null ? '' : String(e.note),
      status: e.status == null ? '' : String(e.status),
      createdAt: String(e.created_at),
      createdBy: e.created_by == null ? '' : String(e.created_by),
    })),
  };
}

/** Counts per status, tier and group, plus follow-ups due today, for the board header. */
export async function coldcallStats(db: Client) {
  const today = new Date().toISOString().slice(0, 10);
  const [status, tier, group, due] = await Promise.all([
    db.execute('SELECT status AS k, COUNT(*) AS n FROM coldcall_leads GROUP BY status'),
    db.execute('SELECT tier AS k, COUNT(*) AS n FROM coldcall_leads GROUP BY tier'),
    db.execute('SELECT lead_group AS k, COUNT(*) AS n FROM coldcall_leads GROUP BY lead_group'),
    db.execute({ sql: "SELECT COUNT(*) AS n FROM coldcall_leads WHERE follow_up IS NOT NULL AND follow_up <> '' AND follow_up <= ?", args: [today] }),
  ]);
  const tally = (r: { rows: Record<string, unknown>[] }) => Object.fromEntries(r.rows.map((x) => [String(x.k ?? ''), Number(x.n)]));
  return { byStatus: tally(status), byTier: tally(tier), byGroup: tally(group), followUpsDue: Number(due.rows[0]?.n ?? 0) };
}

// ---------- Writes ----------

function eventStatement(leadId: string, e: { type: string; outcome?: string; note?: string; status?: string; by: string }, at: string): InStatement {
  return {
    sql: 'INSERT INTO coldcall_events (id, lead_id, type, outcome, note, status, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [randomUUID(), leadId, e.type, e.outcome ?? null, e.note ?? null, e.status ?? null, at, e.by],
  };
}

/**
 * Adds leads, or updates the ones already on file (same phone, or same name + address). On an
 * existing lead only the fields sent change, and status / notes / order / followUp only change
 * when updateTracking is true, so the lead finder can re-send its whole board safely.
 */
export async function upsertColdcallLeads(
  db: Client,
  inputs: Record<string, unknown>[],
  opts: { by: string; updateTracking?: boolean }
) {
  if (!inputs.length) throw new ColdcallError(400, 'Send at least one lead');
  if (inputs.length > 250) throw new ColdcallError(400, 'At most 250 leads per call');

  type Known = { id: string; name: string; phone: string; address: string; status: string };
  const existing = await db.execute('SELECT id, name, phone, address, match_key, status FROM coldcall_leads');
  const byKey = new Map<string, Known>();
  const byId = new Map<string, Known>();
  for (const r of existing.rows) {
    const known = { id: String(r.id), name: String(r.name ?? ''), phone: String(r.phone ?? ''), address: String(r.address ?? ''), status: String(r.status ?? '') };
    byKey.set(String(r.match_key), known);
    byId.set(known.id, known);
  }

  const now = new Date().toISOString();
  const statements: InStatement[] = [];
  const results: { index: number; id?: string; name: string; action: 'created' | 'updated' | 'skipped'; error?: string }[] = [];

  inputs.forEach((input, index) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      results.push({ index, name: '', action: 'skipped', error: 'Not an object' });
      return;
    }
    // An id from an earlier response wins; otherwise match on phone, or name + address.
    const byGivenId = typeof input.id === 'string' ? byId.get(input.id) : undefined;
    const name = text(input.name, 200) || byGivenId?.name || '';
    if (!name) {
      results.push({ index, name: '', action: 'skipped', error: 'name is required' });
      return;
    }
    const found = byGivenId ?? byKey.get(matchKey(name, text(input.phone, 50), text(input.address, 500)));

    if (found) {
      const values = pickFields(input, opts.updateTracking ? new Set() : TRACKING_FIELDS);
      if ('name' in values && !values.name) delete values.name;
      const fields = Object.keys(values);
      // The key is rebuilt from what's on file plus what was sent, so a partial update keeps it.
      const merged = {
        name: String(values.name ?? found.name),
        phone: String(values.phone ?? found.phone),
        address: String(values.address ?? found.address),
      };
      const key = matchKey(merged.name, merged.phone, merged.address);
      if (fields.length) {
        statements.push({
          sql: `UPDATE coldcall_leads SET ${fields.map((f) => `${FIELDS[f].col} = ?`).join(', ')}, match_key = ?, updated_at = ? WHERE id = ?`,
          args: [...fields.map((f) => values[f]), key, now, found.id],
        });
        if (values.status !== undefined && values.status !== found.status) {
          statements.push(eventStatement(found.id, { type: 'status', status: String(values.status), note: 'Changed by sync', by: opts.by }, now));
        }
      }
      results.push({ index, id: found.id, name, action: 'updated' });
      return;
    }

    const values: Record<string, string | number | null> = {};
    for (const field of COLDCALL_FIELDS) values[field] = parseField(field, input[field]);
    values.name = name;
    if (!values.status) values.status = 'To contact';
    const key = matchKey(name, String(values.phone), String(values.address));
    const id = randomUUID();
    const cols = COLDCALL_FIELDS.map((f) => FIELDS[f].col);
    statements.push({
      sql: `INSERT INTO coldcall_leads (id, ${cols.join(', ')}, match_key, attempts, created_at, updated_at)
            VALUES (?, ${cols.map(() => '?').join(', ')}, ?, 0, ?, ?)`,
      args: [id, ...COLDCALL_FIELDS.map((f) => values[f]), key, now, now],
    });
    statements.push(eventStatement(id, { type: 'added', note: `Added by ${opts.by}`, status: String(values.status), by: opts.by }, now));
    byKey.set(key, { id, name, phone: String(values.phone), address: String(values.address), status: String(values.status) });
    results.push({ index, id, name, action: 'created' });
  });

  if (statements.length) await db.batch(statements, 'write');
  return {
    created: results.filter((r) => r.action === 'created').length,
    updated: results.filter((r) => r.action === 'updated').length,
    skipped: results.filter((r) => r.action === 'skipped').length,
    results,
  };
}

/** Changes the fields sent (tracking fields included). A status change is logged. */
export async function updateColdcallLead(db: Client, id: string, input: Record<string, unknown>, by: string) {
  const values = pickFields(input);
  if ('name' in values && !values.name) throw new ColdcallError(400, 'name cannot be empty');
  const fields = Object.keys(values);
  if (!fields.length) throw new ColdcallError(400, `Send at least one field to change: ${COLDCALL_FIELDS.join(', ')}`);

  const before = await db.execute({ sql: 'SELECT name, phone, address, status FROM coldcall_leads WHERE id = ?', args: [id] });
  const row = before.rows[0];
  if (!row) throw new ColdcallError(404, 'Lead not found');
  const key = matchKey(
    String(values.name ?? row.name ?? ''),
    String(values.phone ?? row.phone ?? ''),
    String(values.address ?? row.address ?? '')
  );
  const now = new Date().toISOString();
  const statements: InStatement[] = [
    {
      sql: `UPDATE coldcall_leads SET ${fields.map((f) => `${FIELDS[f].col} = ?`).join(', ')}, match_key = ?, updated_at = ? WHERE id = ?`,
      args: [...fields.map((f) => values[f]), key, now, id],
    },
  ];
  if (values.status !== undefined && values.status !== String(row.status ?? '')) {
    statements.push(eventStatement(id, { type: 'status', status: String(values.status), by }, now));
  }
  await db.batch(statements, 'write');
  return (await getColdcallLead(db, id))!;
}

/**
 * Logs what happened on a call or message. The outcome (see CALL_OUTCOMES) sets the status unless
 * a status is sent too; a call or DM counts as an attempt.
 */
export async function logColdcall(
  db: Client,
  id: string,
  input: { outcome?: unknown; note?: unknown; status?: unknown; followUp?: unknown; type?: unknown },
  by: string
) {
  const outcome = text(input.outcome, 100);
  const note = text(input.note, 4000);
  const followUp = text(input.followUp, 10);
  if (!outcome && !note) throw new ColdcallError(400, `Send an outcome (${Object.keys(CALL_OUTCOMES).join(', ')}) and/or a note`);
  if (followUp && !/^\d{4}-\d{2}-\d{2}$/.test(followUp)) throw new ColdcallError(400, 'followUp must be YYYY-MM-DD');

  const before = await db.execute({ sql: 'SELECT status FROM coldcall_leads WHERE id = ?', args: [id] });
  if (!before.rows[0]) throw new ColdcallError(404, 'Lead not found');
  const status = text(input.status, 100) || CALL_OUTCOMES[outcome] || '';
  const type = text(input.type, 20) || (outcome === 'Sent DM' || outcome === 'They replied' ? 'message' : outcome ? 'call' : 'note');
  const attempt = type === 'call' || outcome === 'Sent DM' ? 1 : 0;
  const now = new Date().toISOString();

  const sets = ['updated_at = ?'];
  const args: (string | number | null)[] = [now];
  if (status) {
    sets.push('status = ?');
    args.push(status);
  }
  if (attempt) {
    sets.push('attempts = attempts + 1', 'last_contacted_at = ?');
    args.push(now);
  }
  // A follow-up is set when sent; a call that didn't end in "call back" clears the old one.
  if (followUp) {
    sets.push('follow_up = ?');
    args.push(followUp);
  } else if (attempt && status !== 'Call back') sets.push('follow_up = NULL');

  await db.batch(
    [
      { sql: `UPDATE coldcall_leads SET ${sets.join(', ')} WHERE id = ?`, args: [...args, id] },
      eventStatement(id, { type, outcome, note: [note, followUp && `Follow up ${followUp}`].filter(Boolean).join(' · '), status, by }, now),
    ],
    'write'
  );
  return (await getColdcallLead(db, id))!;
}

export async function setColdcallContact(db: Client, id: string, contactId: string) {
  await db.execute({ sql: 'UPDATE coldcall_leads SET contact_id = ?, updated_at = ? WHERE id = ?', args: [contactId, new Date().toISOString(), id] });
}

export async function deleteColdcallLead(db: Client, id: string): Promise<boolean> {
  const result = await db.batch(
    [
      { sql: 'DELETE FROM coldcall_leads WHERE id = ?', args: [id] },
      { sql: 'DELETE FROM coldcall_events WHERE lead_id = ?', args: [id] },
    ],
    'write'
  );
  return result[0].rowsAffected > 0;
}
