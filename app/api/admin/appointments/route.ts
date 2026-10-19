import { NextRequest, NextResponse } from 'next/server';
import { requireStaff, sessionRole } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { createAppointmentLink, listAppointmentLinks, publicAppointment } from '@/lib/appointments';
import { calendlyConfigured } from '@/lib/calendly';

// Appointment links for setters and admins. Setters only ever see the links they made.

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function errorResponse(error: unknown, label: string) {
  console.error(`${label}:`, error);
  if (error instanceof Error && error.message === 'Unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireStaff();
    const isAdmin = sessionRole(session) === 'admin';
    const params = request.nextUrl.searchParams;

    const db = getAdminDb();
    await initializeTables(db);
    const links = await listAppointmentLinks(db, {
      createdBy: isAdmin ? params.get('setBy') || undefined : session.sub,
      contactId: isAdmin ? params.get('contactId') || undefined : undefined,
      status: params.get('status') || undefined,
      search: str(params.get('search'), 100) || undefined,
    });

    return NextResponse.json({
      data: links.map((l) => publicAppointment(l, request.nextUrl.origin)),
      role: sessionRole(session),
      calendly: calendlyConfigured(),
    });
  } catch (error) {
    return errorResponse(error, 'Appointment list error');
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireStaff();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const clientName = str(body.clientName, 120);
    const businessName = str(body.businessName, 160);
    if (!clientName) return NextResponse.json({ error: 'Add their name' }, { status: 400 });
    if (!businessName) return NextResponse.json({ error: 'Add the business name' }, { status: 400 });

    const db = getAdminDb();
    await initializeTables(db);
    const link = await createAppointmentLink(db, {
      clientName,
      businessName,
      socialUrl: str(body.socialUrl, 500),
      gbpUrl: str(body.gbpUrl, 500),
      createdBy: session.sub,
      createdByName: session.name ?? 'Admin',
    });

    return NextResponse.json(publicAppointment(link, request.nextUrl.origin), { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Appointment create error');
  }
}
