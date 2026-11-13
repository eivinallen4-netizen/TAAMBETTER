import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { defineModule, defineOp, OpError, OWNER_ONLY, type OpContext } from '@taam/crm/server';
import { decryptKey, encryptKey, installsKeyConfigured, keyHint, requireInstallsKey } from './crypto';
import { installMigrations } from './migrations';
import { adminUrlFor, fetchSummary, normalizeSiteUrl, type FetchResult, type InstallSummary } from './remote';

// Client installs: the TAAM CRM keeps a list of the CRMs it has installed for clients. Each one is
// connected by its address and an API key made on that install ("Summary only" access), and shows
// its live status and headline numbers, with a one-click link to its admin. Owner only.
// The screen is app/admin/installs/page.tsx.

const PERMISSION = 'installs:manage';

/** Refreshes run at most this many installs at once. */
const CONCURRENCY = 4;

/** The screen refreshes everything on open when the newest check is older than this. */
export const STALE_AFTER_MINUTES = 15;

type Db = OpContext['db'];

interface InstallRow {
  id: string;
  name: string;
  site_url: string;
  api_path: string;
  admin_url: string;
  key_enc: string;
  key_hint: string;
  status: string;
  last_error: string;
  version: string;
  summary: string;
  last_checked_at: string | null;
  last_ok_at: string | null;
  created_at: string;
  updated_at: string;
}

/** What screens and the API see. Never includes the key, only its last 4 characters. */
export interface PublicInstall {
  id: string;
  name: string;
  site_url: string;
  api_path: string;
  admin_url: string;
  key_hint: string;
  status: string;
  last_error: string;
  version: string;
  summary: InstallSummary | null;
  last_checked_at: string | null;
  last_ok_at: string | null;
  created_at: string;
  updated_at: string;
}

const nowIso = () => new Date().toISOString();

function toRow(r: Record<string, unknown>): InstallRow {
  const s = (k: string) => (r[k] == null ? '' : String(r[k]));
  const n = (k: string) => (r[k] == null ? null : String(r[k]));
  return {
    id: s('id'),
    name: s('name'),
    site_url: s('site_url'),
    api_path: s('api_path'),
    admin_url: s('admin_url'),
    key_enc: s('key_enc'),
    key_hint: s('key_hint'),
    status: s('status') || 'unknown',
    last_error: s('last_error'),
    version: s('version'),
    summary: s('summary'),
    last_checked_at: n('last_checked_at'),
    last_ok_at: n('last_ok_at'),
    created_at: s('created_at'),
    updated_at: s('updated_at'),
  };
}

function toPublic(row: InstallRow): PublicInstall {
  let summary: InstallSummary | null = null;
  if (row.summary) {
    try {
      summary = JSON.parse(row.summary) as InstallSummary;
    } catch {
      summary = null;
    }
  }
  const { key_enc: _secret, summary: _raw, ...rest } = row;
  return { ...rest, summary };
}

async function allRows(db: Db): Promise<InstallRow[]> {
  const result = await db.execute('SELECT * FROM taam_client_installs ORDER BY lower(name), site_url');
  return result.rows.map((r) => toRow(r as unknown as Record<string, unknown>));
}

async function rowById(db: Db, id: string): Promise<InstallRow> {
  const result = await db.execute({ sql: 'SELECT * FROM taam_client_installs WHERE id = ?', args: [id] });
  const row = result.rows[0];
  if (!row) throw new OpError(404, 'Client install not found');
  return toRow(row as unknown as Record<string, unknown>);
}

async function siteTaken(db: Db, siteUrl: string, exceptId = ''): Promise<boolean> {
  const result = await db.execute({ sql: 'SELECT id FROM taam_client_installs WHERE site_url = ? AND id <> ?', args: [siteUrl, exceptId] });
  return result.rows.length > 0;
}

function siteOrThrow(input: string): string {
  try {
    return normalizeSiteUrl(input);
  } catch (error) {
    throw new OpError(400, error instanceof Error ? error.message : 'Bad address');
  }
}

/** Runs the check before an add or a change is saved: only an install that answers "ok" is kept. */
async function checkOrThrow(siteUrl: string, apiKey: string): Promise<FetchResult & { summary: InstallSummary }> {
  const result = await fetchSummary(siteUrl, apiKey);
  if (result.status !== 'ok' || !result.summary) {
    const status = result.status === 'unauthorized' || result.status === 'forbidden' ? 400 : result.status === 'rate_limited' ? 429 : 502;
    throw new OpError(status, result.error || 'The install could not be checked.');
  }
  return result as FetchResult & { summary: InstallSummary };
}

/** Saves the outcome of a check. A failed check keeps the last good summary and version. */
async function saveCheck(db: Db, row: InstallRow, result: FetchResult): Promise<void> {
  const now = nowIso();
  if (result.status === 'ok' && result.summary) {
    await db.execute({
      sql: `UPDATE taam_client_installs
            SET status = 'ok', last_error = '', api_path = ?, admin_url = ?, version = ?, summary = ?,
                last_checked_at = ?, last_ok_at = ?, updated_at = ?
            WHERE id = ?`,
      args: [result.apiPath, adminUrlFor(row.site_url, result.summary), result.summary.crm.version, JSON.stringify(result.summary), now, now, now, row.id],
    });
  } else {
    await db.execute({
      sql: `UPDATE taam_client_installs SET status = ?, last_error = ?, api_path = CASE WHEN ? <> '' THEN ? ELSE api_path END, last_checked_at = ?, updated_at = ? WHERE id = ?`,
      args: [result.status, result.error.slice(0, 500), result.apiPath, result.apiPath, now, now, row.id],
    });
  }
}

async function refreshRow(db: Db, row: InstallRow): Promise<void> {
  let result: FetchResult;
  try {
    result = await fetchSummary(row.site_url, decryptKey(row.id, row.key_enc), row.api_path);
  } catch (error) {
    result = { status: 'error', error: error instanceof Error ? error.message : 'The saved key could not be read.', apiPath: '' };
  }
  await saveCheck(db, row, result);
}

/** Checks every install, a few at a time. */
async function refreshAll(db: Db): Promise<{ checked: number; ok: number }> {
  requireInstallsKey();
  const rows = await allRows(db);
  let next = 0;
  const worker = async () => {
    while (next < rows.length) {
      const row = rows[next++];
      await refreshRow(db, row);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, rows.length) }, worker));
  const after = await allRows(db);
  return { checked: rows.length, ok: after.filter((r) => r.status === 'ok').length };
}

async function listResult(db: Db) {
  const installs = (await allRows(db)).map(toPublic);
  // `now` is the server's clock, so the screen judges staleness without trusting the viewer's clock.
  return { installs, key_configured: installsKeyConfigured(), stale_after_minutes: STALE_AFTER_MINUTES, now: nowIso() };
}

const zId = z.string().min(1).max(64).describe('Client install id');
const zSite = z.string().trim().min(1).max(300).describe('Address of the client CRM site, e.g. https://crm.client.com');
const zKey = z
  .string()
  .trim()
  .min(16, 'That API key is too short')
  .max(200)
  .regex(/^[A-Za-z0-9_-]+$/, 'That does not look like an API key')
  .describe('An API key made on that install, ideally with "Summary only" access');
const zName = z.string().trim().max(120).describe('Name shown on the card. Defaults to the company name the install reports.');

const operations = [
  defineOp({
    name: 'list_client_installs',
    description:
      'The client CRM installs TAAM looks after, with each one\'s last known status (ok, unreachable, unauthorized, forbidden, outdated, rate_limited, error), CRM version and summary counts. API keys are never returned, only key_hint (the last 4 characters).',
    method: 'GET',
    path: '/installs',
    permission: PERMISSION,
    readOnly: true,
    input: z.object({}),
    run: async (_input, ctx) => listResult(ctx.db),
  }),
  defineOp({
    name: 'add_client_install',
    description: 'Connect a client CRM install by its address and an API key made on it. The install is checked first and only saved when it answers. Returns { install }.',
    method: 'POST',
    path: '/installs',
    permission: PERMISSION,
    openWorld: true,
    input: z.object({ site_url: zSite, api_key: zKey, name: zName.optional() }),
    run: async (input, ctx) => {
      requireInstallsKey();
      const site = siteOrThrow(input.site_url);
      if (await siteTaken(ctx.db, site)) throw new OpError(409, 'That install is already on the list.');
      const checked = await checkOrThrow(site, input.api_key);
      const id = randomUUID();
      const now = nowIso();
      const name = input.name?.trim() || checked.summary.company?.name?.trim() || new URL(site).hostname;
      await ctx.db.execute({
        sql: `INSERT INTO taam_client_installs
              (id, name, site_url, api_path, admin_url, key_enc, key_hint, status, last_error, version, summary, last_checked_at, last_ok_at, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'ok', '', ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          name,
          site,
          checked.apiPath,
          adminUrlFor(site, checked.summary),
          encryptKey(id, input.api_key),
          keyHint(input.api_key),
          checked.summary.crm.version,
          JSON.stringify(checked.summary),
          now,
          now,
          now,
          now,
        ],
      });
      return { install: toPublic(await rowById(ctx.db, id)) };
    },
  }),
  defineOp({
    name: 'update_client_install',
    description: 'Rename a client install, or change its address or API key. A new address or key is checked before it is saved. Returns { install }.',
    method: 'PATCH',
    path: '/installs/{id}',
    permission: PERMISSION,
    openWorld: true,
    input: z.object({ id: zId, name: zName.optional(), site_url: zSite.optional(), api_key: zKey.optional() }),
    run: async (input, ctx) => {
      requireInstallsKey();
      const row = await rowById(ctx.db, input.id);
      const site = input.site_url ? siteOrThrow(input.site_url) : row.site_url;
      const name = input.name === undefined ? row.name : input.name.trim() || row.name;
      const now = nowIso();
      if (site !== row.site_url || input.api_key) {
        if (site !== row.site_url && (await siteTaken(ctx.db, site, row.id))) throw new OpError(409, 'That install is already on the list.');
        // The saved key is only ever sent to the address it was saved for: a new address needs a
        // key pasted with it, so a typo cannot hand a client's key to someone else's server.
        if (site !== row.site_url && !input.api_key) throw new OpError(400, 'Paste the API key for the new address.');
        const apiKey = input.api_key || decryptKey(row.id, row.key_enc);
        const checked = await checkOrThrow(site, apiKey);
        await ctx.db.execute({
          sql: `UPDATE taam_client_installs
                SET name = ?, site_url = ?, api_path = ?, admin_url = ?, key_enc = ?, key_hint = ?, status = 'ok', last_error = '',
                    version = ?, summary = ?, last_checked_at = ?, last_ok_at = ?, updated_at = ?
                WHERE id = ?`,
          args: [
            name,
            site,
            checked.apiPath,
            adminUrlFor(site, checked.summary),
            encryptKey(row.id, apiKey),
            keyHint(apiKey),
            checked.summary.crm.version,
            JSON.stringify(checked.summary),
            now,
            now,
            now,
            row.id,
          ],
        });
      } else {
        await ctx.db.execute({ sql: 'UPDATE taam_client_installs SET name = ?, updated_at = ? WHERE id = ?', args: [name, now, row.id] });
      }
      return { install: toPublic(await rowById(ctx.db, row.id)) };
    },
  }),
  defineOp({
    name: 'remove_client_install',
    description: 'Take a client install off the list and forget its saved API key. The install itself is not touched; revoke the key on it too.',
    method: 'DELETE',
    path: '/installs/{id}',
    permission: PERMISSION,
    input: z.object({ id: zId }),
    run: async ({ id }, ctx) => {
      await rowById(ctx.db, id);
      await ctx.db.execute({ sql: 'DELETE FROM taam_client_installs WHERE id = ?', args: [id] });
      return { removed: true };
    },
  }),
  defineOp({
    name: 'refresh_client_install',
    description: 'Check one client install now and save its status and summary. Returns { install }.',
    method: 'POST',
    path: '/installs/{id}/refresh',
    permission: PERMISSION,
    openWorld: true,
    input: z.object({ id: zId }),
    run: async ({ id }, ctx) => {
      requireInstallsKey();
      await refreshRow(ctx.db, await rowById(ctx.db, id));
      return { install: toPublic(await rowById(ctx.db, id)) };
    },
  }),
  defineOp({
    name: 'refresh_client_installs',
    description: `Check every client install now (${CONCURRENCY} at a time) and save their status and summaries. Returns the same as list_client_installs.`,
    method: 'POST',
    path: '/installs/refresh',
    permission: PERMISSION,
    openWorld: true,
    input: z.object({}),
    run: async (_input, ctx) => {
      await refreshAll(ctx.db);
      return listResult(ctx.db);
    },
  }),
];

export const taamInstallsModule = defineModule({
  id: 'taam-installs',
  label: 'Client installs',
  description: 'The client CRM installs TAAM looks after: live status, headline numbers and a link to each admin.',
  // Only the owner: the saved keys reach into every client's CRM.
  permissions: { [PERMISSION]: OWNER_ONLY },
  migrations: installMigrations,
  nav: [{ group: 'Client CRMs', label: 'Client installs', href: '/installs', icon: 'Building2', permission: PERMISSION, order: 400 }],
  cron: [
    {
      id: 'taam-installs.refresh',
      description: 'Checks every client CRM install and saves its status and summary.',
      schedule: 'daily',
      run: async (ctx) => {
        if (!installsKeyConfigured()) return 'skipped: CRM_INSTALLS_KEY is not set';
        return refreshAll(ctx.db);
      },
    },
  ],
  operations,
});
