import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { createApiKey, listApiKeys, revokeApiKey } from '@/lib/api-auth';

function errorResponse(error: unknown, label: string) {
  if (error instanceof Error && error.message === 'Unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.error(`${label}:`, error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function GET() {
  try {
    await requireAdmin();
    const db = getAdminDb();
    await initializeTables(db);
    return NextResponse.json({ data: await listApiKeys(db) });
  } catch (error) {
    return errorResponse(error, 'API key list error');
  }
}

/** Makes a key. The full key is only ever in this response. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const db = getAdminDb();
    await initializeTables(db);
    const { key, info } = await createApiKey(db, String(body.name ?? ''));
    return NextResponse.json({ key, ...info }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'API key create error');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const id = request.nextUrl.searchParams.get('id') ?? '';
    const db = getAdminDb();
    await initializeTables(db);
    await revokeApiKey(db, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, 'API key revoke error');
  }
}
