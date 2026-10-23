import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { createAppointmentLink, publicAppointment } from '@/lib/appointments';
import { getColdcallLead, logColdcall, setColdcallContact } from '@/lib/coldcall';

// When a cold call goes well: make the prospect's appointment link (which also makes the CRM
// contact), tie the lead to that contact, and log it. A second click reuses the same contact.

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStaff();
    const { id } = await params;
    const db = getAdminDb();
    await initializeTables(db);
    const lead = await getColdcallLead(db, id);
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const link = await createAppointmentLink(db, {
      clientName: String(lead.contactName || lead.name),
      businessName: String(lead.name),
      socialUrl: String(lead.instagramUrl || lead.facebookUrl || ''),
      gbpUrl: String(lead.googleUrl || ''),
      contactId: lead.contactId ? String(lead.contactId) : undefined,
      createdBy: session.sub,
      createdByName: session.name ?? 'Admin',
    });
    if (link.contact_id) await setColdcallContact(db, id, link.contact_id);
    const updated = await logColdcall(db, id, { type: 'note', note: `Appointment link made: ${publicAppointment(link, request.nextUrl.origin).url}` }, session.name ?? 'Admin');

    return NextResponse.json({ lead: updated, appointment: publicAppointment(link, request.nextUrl.origin) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('Cold-call appointment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
