import { createHash, randomBytes, randomUUID } from 'crypto';
import type { Client } from '@libsql/client';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from './admin-db';
import { initializeTables } from './init-tables';
import { createRateLimiter } from './ratelimit';

// API keys for the CRM REST API (/api/v1) and the MCP endpoint (/api/mcp). A key is shown once
// when it's made; only its sha256 is stored. Keys have full admin access to the CRM.

export interface ApiKeyInfo {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

const hash = (key: string) => createHash('sha256').update(key).digest('hex');

export async function createApiKey(db: Client, name: string): Promise<{ key: string; info: ApiKeyInfo }> {
  const key = `taam_${randomBytes(24).toString('base64url')}`;
  const info: ApiKeyInfo = {
    id: randomUUID(),
    name: name.trim().slice(0, 80) || 'API key',
    prefix: key.slice(0, 10),
    created_at: new Date().toISOString(),
    last_used_at: null,
    revoked_at: null,
  };
  await db.execute({
    sql: 'INSERT INTO api_keys (id, name, key_hash, prefix, created_at) VALUES (?, ?, ?, ?, ?)',
    args: [info.id, info.name, hash(key), info.prefix, info.created_at],
  });
  return { key, info };
}

export async function listApiKeys(db: Client): Promise<ApiKeyInfo[]> {
  const result = await db.execute('SELECT id, name, prefix, created_at, last_used_at, revoked_at FROM api_keys ORDER BY created_at DESC');
  return result.rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    prefix: String(r.prefix),
    created_at: String(r.created_at),
    last_used_at: r.last_used_at == null ? null : String(r.last_used_at),
    revoked_at: r.revoked_at == null ? null : String(r.revoked_at),
  }));
}

export async function revokeApiKey(db: Client, id: string): Promise<void> {
  await db.execute({ sql: 'UPDATE api_keys SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL', args: [new Date().toISOString(), id] });
}

/** The key's row if it's live, else null. Stamps last_used_at. */
export async function verifyApiKey(db: Client, key: string): Promise<{ id: string; name: string } | null> {
  if (!/^taam_[A-Za-z0-9_-]{20,64}$/.test(key)) return null;
  const result = await db.execute({ sql: 'SELECT id, name FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL', args: [hash(key)] });
  const row = result.rows[0];
  if (!row) return null;
  await db.execute({ sql: 'UPDATE api_keys SET last_used_at = ? WHERE id = ?', args: [new Date().toISOString(), String(row.id)] });
  return { id: String(row.id), name: String(row.name) };
}

export function bearerKey(request: NextRequest): string {
  const header = request.headers.get('authorization') ?? '';
  const match = /^Bearer\s+(\S+)$/i.exec(header);
  return match ? match[1] : request.headers.get('x-api-key') ?? '';
}

const apiLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 120 });

/** Checks the key and the per-key rate limit. Returns the db + key, or the error response to send. */
export async function authenticateApiKey(
  request: NextRequest,
  key = bearerKey(request)
): Promise<{ db: Client; key: { id: string; name: string } } | { error: NextResponse }> {
  const db = getAdminDb();
  await initializeTables(db);
  const found = await verifyApiKey(db, key);
  if (!found) return { error: apiJson({ error: 'Missing or invalid API key. Send Authorization: Bearer taam_…' }, 401) };
  const limit = apiLimiter(request, `api:${found.id}`);
  if (!limit.allowed) return { error: apiJson({ error: 'Too many requests, slow down' }, 429) };
  return { db, key: found };
}

export function apiJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}
