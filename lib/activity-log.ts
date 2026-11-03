import { randomUUID } from 'crypto';
import type { Client } from '@libsql/client';

// Who did what, when: every MCP tool call (lib/crm/mcp.ts) and REST API call (/api/v1), and every
// admin action on SEO pages (app/api/admin/pages). Shown at /admin/pages/activity. Logging never
// breaks the action it records.

export interface ActivityEntry {
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

export async function initActivityTable(db: Client): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      target TEXT,
      detail TEXT,
      ok INTEGER NOT NULL DEFAULT 1,
      error TEXT,
      created_at TEXT NOT NULL
    )
  `);
  await db.execute('CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at)');
}

/** Long strings (page bodies) are cut so the log stays small. */
function summarize(detail: unknown): string {
  if (detail == null) return '';
  const json = JSON.stringify(detail, (_k, v) => (typeof v === 'string' && v.length > 300 ? `${v.slice(0, 300)}… (${v.length} chars)` : v));
  return json.length > 4000 ? `${json.slice(0, 4000)}…` : json;
}

export async function logActivity(
  db: Client,
  entry: { source: ActivityEntry['source']; actor: string; action: string; target?: string; detail?: unknown; ok?: boolean; error?: string }
): Promise<void> {
  try {
    await db.execute({
      sql: 'INSERT INTO activity_log (id, source, actor, action, target, detail, ok, error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        randomUUID(),
        entry.source,
        entry.actor.slice(0, 200),
        entry.action.slice(0, 100),
        (entry.target ?? '').slice(0, 300),
        summarize(entry.detail),
        entry.ok === false ? 0 : 1,
        (entry.error ?? '').slice(0, 1000),
        new Date().toISOString(),
      ],
    });
  } catch (err) {
    console.error('Activity log write failed:', err);
  }
}

export async function listActivity(
  db: Client,
  opts: { source?: string; search?: string; limit?: number; offset?: number } = {}
): Promise<{ total: number; data: ActivityEntry[] }> {
  const search = (opts.search ?? '').trim().slice(0, 100);
  const like = `%${search}%`;
  const source = ['mcp', 'api', 'admin'].includes(opts.source ?? '') ? opts.source! : '';
  const where = `(? = '' OR source = ?) AND (? = '' OR actor LIKE ? OR action LIKE ? OR target LIKE ?)`;
  const args = [source, source, search, like, like, like];
  const limit = Math.max(1, Math.min(500, opts.limit ?? 200));
  const offset = Math.max(0, opts.offset ?? 0);
  const [count, result] = await Promise.all([
    db.execute({ sql: `SELECT COUNT(*) AS n FROM activity_log WHERE ${where}`, args }),
    db.execute({ sql: `SELECT * FROM activity_log WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, args: [...args, limit, offset] }),
  ]);
  return {
    total: Number(count.rows[0]?.n ?? 0),
    data: result.rows.map((r) => ({
      id: String(r.id),
      source: r.source === 'mcp' || r.source === 'api' ? r.source : 'admin',
      actor: String(r.actor ?? ''),
      action: String(r.action ?? ''),
      target: String(r.target ?? ''),
      detail: String(r.detail ?? ''),
      ok: Number(r.ok) === 1,
      error: String(r.error ?? ''),
      created_at: String(r.created_at),
    })),
  };
}
