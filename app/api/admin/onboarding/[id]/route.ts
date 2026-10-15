import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { decryptPasswords, getOnboardingById, onboardingUrl } from '@/lib/onboarding-store';
import { ONBOARDING_STATUSES, type OnboardingStatus } from '@/app/lib/onboarding';

const ID_RE = /^[a-f0-9-]{36}$/i;

function errorResponse(error: unknown, label: string) {
  console.error(`${label}:`, error);
  if (error instanceof Error && error.message === 'Unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!ID_RE.test(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const db = getAdminDb();
    await initializeTables(db);
    const row = await getOnboardingById(db, id);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let passwords = {};
    let passwordError = '';
    try {
      passwords = decryptPasswords(row.credentials);
    } catch (err) {
      console.error('Onboarding decrypt error:', err);
      passwordError = 'Saved passwords could not be decrypted. Check ONBOARDING_ENCRYPTION_KEY.';
    }

    const { token, ...rest } = row;
    return NextResponse.json(
      { ...rest, credentials: undefined, url: onboardingUrl(token, request.nextUrl.origin), passwords, passwordError },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    return errorResponse(error, 'Onboarding fetch error');
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!ID_RE.test(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const sets: string[] = [];
    const args: (string | null)[] = [];

    if (typeof body.status === 'string') {
      if (!ONBOARDING_STATUSES.includes(body.status as OnboardingStatus)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      sets.push('status = ?');
      args.push(body.status);
      // Re-opening the link lets the client edit again.
      if (body.status === 'in_progress' || body.status === 'opened' || body.status === 'sent') {
        sets.push('submitted_at = NULL');
      }
    }
    if (typeof body.admin_notes === 'string') {
      sets.push('admin_notes = ?');
      args.push(body.admin_notes.slice(0, 5000));
    }
    for (const key of ['client_name', 'business_name', 'client_email', 'message'] as const) {
      if (typeof body[key] === 'string') {
        sets.push(`${key} = ?`);
        args.push((body[key] as string).trim().slice(0, 1500));
      }
    }
    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

    sets.push('updated_at = ?');
    args.push(new Date().toISOString());

    const db = getAdminDb();
    await initializeTables(db);
    const result = await db.execute({
      sql: `UPDATE client_onboardings SET ${sets.join(', ')} WHERE id = ?`,
      args: [...args, id],
    });
    if (result.rowsAffected === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, 'Onboarding update error');
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!ID_RE.test(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const db = getAdminDb();
    await initializeTables(db);
    await db.execute({ sql: 'DELETE FROM client_onboardings WHERE id = ?', args: [id] });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, 'Onboarding delete error');
  }
}
