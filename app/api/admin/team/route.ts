import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { createTeamMember, listTeam, updateTeamMember } from '@/lib/crm-users';

// Team logins: admins add appointment setters (and other admins), reset passwords, switch them off.

function errorResponse(error: unknown, label: string) {
  if (error instanceof Error && error.message === 'Unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.error(`${label}:`, error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

const role = (v: unknown) => (v === 'admin' ? 'admin' : 'setter');

export async function GET() {
  try {
    await requireAdmin();
    const db = getAdminDb();
    await initializeTables(db);
    return NextResponse.json({ data: await listTeam(db) });
  } catch (error) {
    return errorResponse(error, 'Team list error');
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const db = getAdminDb();
    await initializeTables(db);
    try {
      const member = await createTeamMember(db, {
        name: String(body.name ?? ''),
        username: String(body.username ?? ''),
        password: String(body.password ?? ''),
        role: role(body.role),
      });
      return NextResponse.json(member, { status: 201 });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not add them' }, { status: 400 });
    }
  } catch (error) {
    return errorResponse(error, 'Team create error');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const id = String(body.id ?? '');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const db = getAdminDb();
    await initializeTables(db);
    try {
      await updateTeamMember(db, id, {
        active: typeof body.active === 'boolean' ? body.active : undefined,
        password: typeof body.password === 'string' ? body.password : undefined,
        role: body.role === undefined ? undefined : role(body.role),
        name: typeof body.name === 'string' ? body.name : undefined,
      });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not save' }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, 'Team update error');
  }
}
