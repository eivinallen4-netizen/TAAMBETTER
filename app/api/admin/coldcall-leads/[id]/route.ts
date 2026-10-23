import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireStaff } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { ColdcallError, deleteColdcallLead, getColdcallLead, updateColdcallLead } from '@/lib/coldcall';

function errorResponse(error: unknown, label: string) {
  if (error instanceof ColdcallError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof Error && error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  console.error(`${label}:`, error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    await requireStaff();
    const { id } = await params;
    const db = getAdminDb();
    await initializeTables(db);
    const lead = await getColdcallLead(db, id);
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(lead);
  } catch (error) {
    return errorResponse(error, 'Cold-call fetch error');
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await requireStaff();
    const { id } = await params;
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const db = getAdminDb();
    await initializeTables(db);
    return NextResponse.json(await updateColdcallLead(db, id, body, session.name ?? 'Admin'));
  } catch (error) {
    return errorResponse(error, 'Cold-call update error');
  }
}

/** Admin only. */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const db = getAdminDb();
    await initializeTables(db);
    await deleteColdcallLead(db, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, 'Cold-call delete error');
  }
}
