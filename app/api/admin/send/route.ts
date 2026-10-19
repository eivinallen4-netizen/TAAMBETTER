import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { renderCrmEmail } from '@/lib/crm-email';
import { isMessageType } from '@/app/lib/crm-messages';
import { SendError, sendCrmMessage } from '@/lib/crm/send';

// Sends a branded email to someone already in the CRM: an onboarding link (paid clients only),
// a Zoom link, or any link. GET returns what's been sent to an email address.

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function errorResponse(error: unknown, label: string) {
  console.error(`${label}:`, error);
  if (error instanceof Error && error.message === 'Unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const email = str(request.nextUrl.searchParams.get('email'), 200);
    if (!email) return NextResponse.json({ data: [] });
    const db = getAdminDb();
    await initializeTables(db);
    const result = await db.execute({
      sql: 'SELECT id, type, to_email, to_name, subject, link, sent_at FROM crm_messages WHERE lower(to_email) = lower(?) ORDER BY sent_at DESC LIMIT 50',
      args: [email],
    });
    return NextResponse.json({ data: result.rows });
  } catch (error) {
    return errorResponse(error, 'Sent messages list error');
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const type = body.type;
    if (!isMessageType(type)) return NextResponse.json({ error: 'Pick what to send' }, { status: 400 });

    // Preview: the exact email, nothing saved or sent.
    if (body.preview === true) {
      const name = str(body.name, 120);
      const businessName = str(body.businessName, 160);
      const note = str(body.note, 1500);
      const when = str(body.when, 120);
      const title = str(body.title, 120);
      const firstName = name.split(/\s+/)[0] ?? '';
      const link = str(body.link, 1000) || `${request.nextUrl.origin}/onboarding/your-private-link`;
      const { subject, html } = renderCrmEmail({ type, firstName, businessName, link, when, title, note });
      return NextResponse.json({ subject, html });
    }

    const db = getAdminDb();
    await initializeTables(db);
    try {
      return NextResponse.json(await sendCrmMessage(db, body, request.nextUrl.origin));
    } catch (err) {
      if (err instanceof SendError) return NextResponse.json({ error: err.message }, { status: 400 });
      throw err;
    }
  } catch (error) {
    return errorResponse(error, 'CRM send error');
  }
}
