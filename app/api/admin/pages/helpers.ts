import { NextRequest, NextResponse } from 'next/server';
import type { Client } from '@libsql/client';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { logActivity } from '@/lib/activity-log';
import { PageError, type Actor } from '@/lib/pages/store';

// Shared by the /api/admin/pages routes: admin-only (setters get a 401), the same PageError →
// response mapping everywhere, and an activity log line for every change.

export async function adminContext(): Promise<{ db: Client; actor: Actor }> {
  const session = await requireAdmin();
  const db = getAdminDb();
  await initializeTables(db);
  return { db, actor: { name: session.name ?? 'Admin', kind: 'team' } };
}

export async function readJson(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  } catch {
    throw new PageError(400, 'Invalid JSON');
  }
}

export function logAdmin(db: Client, actor: Actor, action: string, target: string, detail?: unknown, error?: string) {
  return logActivity(db, { source: 'admin', actor: actor.name, action, target, detail, ok: !error, error });
}

export function pageErrorResponse(error: unknown, label: string) {
  if (error instanceof PageError) {
    return NextResponse.json({ error: error.message, issues: error.issues, conflicts: error.conflicts }, { status: error.status });
  }
  if (error instanceof Error && error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  console.error(`${label}:`, error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
