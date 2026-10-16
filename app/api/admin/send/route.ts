import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { sendBrandEmail } from '@/lib/brand-email';
import { renderCrmEmail } from '@/lib/crm-email';
import { createOnboarding, findOpenOnboarding, onboardingUrl } from '@/lib/onboarding-store';
import { MESSAGE_META, RECIPIENT_SOURCES, isMessageType, type RecipientSource } from '@/app/lib/crm-messages';

// Sends a branded email to someone already in the CRM: an onboarding link (paid clients only),
// a Zoom link, or any link. GET returns what's been sent to an email address.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const meta = MESSAGE_META[type];

    const email = str(body.email, 200);
    const name = str(body.name, 120);
    const businessName = str(body.businessName, 160);
    const note = str(body.note, 1500);
    const when = str(body.when, 120);
    const title = str(body.title, 120);
    const firstName = name.split(/\s+/)[0] ?? '';

    // Preview: the exact email, nothing saved or sent.
    if (body.preview === true) {
      const link = str(body.link, 1000) || `${request.nextUrl.origin}/onboarding/your-private-link`;
      const { subject, html } = renderCrmEmail({ type, firstName, businessName, link, when, title, note });
      return NextResponse.json({ subject, html });
    }

    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    const source: RecipientSource = RECIPIENT_SOURCES.includes(body.source as RecipientSource) ? (body.source as RecipientSource) : 'manual';
    const sourceId = str(body.sourceId, 64);

    if (meta.needsPaid && body.paid !== true) {
      return NextResponse.json({ error: 'Onboarding is for paid clients. Confirm they have paid first.' }, { status: 400 });
    }

    let link = str(body.link, 1000);
    if (meta.needsLink && !/^https?:\/\/\S+$/i.test(link)) {
      return NextResponse.json({ error: 'Paste a full link starting with https://' }, { status: 400 });
    }

    const db = getAdminDb();
    await initializeTables(db);

    // Onboarding: reuse their open link if they already have one, so nobody ends up with two.
    let onboardingId: string | null = null;
    if (type === 'website_onboarding' || type === 'social_onboarding') {
      if (!name) return NextResponse.json({ error: "Client's name is required" }, { status: 400 });
      const kind = type === 'website_onboarding' ? 'website' : 'social';
      const now = new Date().toISOString();
      const existing = await findOpenOnboarding(db, email, kind);
      if (existing) {
        await db.execute({
          sql: `UPDATE client_onboardings SET paid_at = COALESCE(paid_at, ?), message = CASE WHEN ? <> '' THEN ? ELSE message END, updated_at = ? WHERE id = ?`,
          args: [now, note, note, now, existing.id],
        });
        onboardingId = existing.id;
        link = onboardingUrl(existing.token, request.nextUrl.origin);
      } else {
        const created = await createOnboarding(db, { kind, clientName: name, businessName, email, message: note, paid: true });
        onboardingId = created.id;
        link = onboardingUrl(created.token, request.nextUrl.origin);
      }
    }

    const { subject, html, text } = renderCrmEmail({ type, firstName, businessName, link, when, title, note });
    await sendBrandEmail({ to: email, subject, html, text, tag: type });

    const sentAt = new Date().toISOString();
    await db.execute({
      sql: `INSERT INTO crm_messages (id, type, to_email, to_name, subject, link, source, source_id, onboarding_id, sent_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [randomUUID(), type, email, name, subject, link, source, sourceId || null, onboardingId, sentAt],
    });

    // A contact who gets onboarding is a paying client now.
    if (meta.needsPaid && source === 'contact' && sourceId) {
      await db.execute({ sql: `UPDATE contacts SET completion_status = 'paid' WHERE id = ?`, args: [sourceId] });
    }

    return NextResponse.json({ ok: true, subject, link, onboardingId, sentAt });
  } catch (error) {
    return errorResponse(error, 'CRM send error');
  }
}
