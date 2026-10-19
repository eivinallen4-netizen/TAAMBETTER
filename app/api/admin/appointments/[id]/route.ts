import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireStaff, sessionRole } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { deleteAppointmentLink, getAppointmentLink, publicAppointment } from '@/lib/appointments';

function errorResponse(error: unknown, label: string) {
  console.error(`${label}:`, error);
  if (error instanceof Error && error.message === 'Unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStaff();
    const { id } = await params;
    const db = getAdminDb();
    await initializeTables(db);
    const link = await getAppointmentLink(db, id);
    if (!link || (sessionRole(session) !== 'admin' && link.created_by !== session.sub)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(publicAppointment(link, request.nextUrl.origin));
  } catch (error) {
    return errorResponse(error, 'Appointment fetch error');
  }
}

/** Admin only. The contact it made stays in the CRM. */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const db = getAdminDb();
    await initializeTables(db);
    await deleteAppointmentLink(db, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error, 'Appointment delete error');
  }
}
