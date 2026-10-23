import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { ColdcallError, logColdcall } from '@/lib/coldcall';

// Logs a call / message outcome on a lead: { outcome, note, status?, followUp? }.

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    return NextResponse.json(await logColdcall(db, id, body, session.name ?? 'Admin'));
  } catch (error) {
    if (error instanceof ColdcallError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Error && error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('Cold-call log error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
