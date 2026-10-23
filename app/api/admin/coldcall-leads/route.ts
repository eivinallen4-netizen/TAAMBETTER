import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { ColdcallError, coldcallStats, listColdcallLeads, upsertColdcallLeads } from '@/lib/coldcall';

// Website cold-call leads for the CRM board. Claude adds them through /api/v1/coldcall-leads or the
// MCP tool add_coldcall_leads; this is the same data for logged-in staff (setters included).

function coldcallErrorResponse(error: unknown, label: string) {
  if (error instanceof ColdcallError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof Error && error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  console.error(`${label}:`, error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function GET() {
  try {
    await requireStaff();
    const db = getAdminDb();
    await initializeTables(db);
    const [list, stats] = await Promise.all([listColdcallLeads(db, { full: true, limit: 1000 }), coldcallStats(db)]);
    return NextResponse.json({ ...list, stats });
  } catch (error) {
    return coldcallErrorResponse(error, 'Cold-call list error');
  }
}

/** One lead from the "Add lead" form, or { leads: [...] } pasted in. */
export async function POST(request: NextRequest) {
  try {
    const session = await requireStaff();
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const leads = Array.isArray(body.leads) ? body.leads : [body];
    const db = getAdminDb();
    await initializeTables(db);
    const result = await upsertColdcallLeads(db, leads as Record<string, unknown>[], { by: session.name ?? 'Admin' });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return coldcallErrorResponse(error, 'Cold-call add error');
  }
}
