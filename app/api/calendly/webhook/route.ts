import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { getAppointmentLinkByToken, markAppointmentBooked, markAppointmentCanceled } from '@/lib/appointments';
import { inviteePhone, verifyWebhookSignature, type CalendlyInvitee } from '@/lib/calendly';

// Calendly calls this on invitee.created / invitee.canceled (registered by scripts/calendly-webhook.mjs).
// The appointment link's token rides along as utm_content, which is how a booking finds its link.

interface WebhookBody {
  event?: string;
  payload?: CalendlyInvitee & {
    scheduled_event?: { uri?: string; start_time?: string; end_time?: string };
  };
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verifyWebhookSignature(request.headers.get('calendly-webhook-signature'), raw)) {
    return NextResponse.json({ error: 'Bad signature' }, { status: 401 });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const p = body.payload;
  const token = p?.tracking?.utm_content ?? '';
  // Bookings that didn't come from an appointment link are fine, just not ours to track.
  if (!p || !token) return NextResponse.json({ ok: true, ignored: true });

  try {
    const db = getAdminDb();
    await initializeTables(db);
    const link = await getAppointmentLinkByToken(db, token);
    if (!link) return NextResponse.json({ ok: true, ignored: true });

    if (body.event === 'invitee.created') {
      await markAppointmentBooked(db, link.id, {
        callStart: p.scheduled_event?.start_time,
        callEnd: p.scheduled_event?.end_time,
        email: p.email,
        name: p.name,
        phone: inviteePhone(p),
        eventUri: p.scheduled_event?.uri ?? p.event,
        inviteeUri: p.uri,
      });
    } else if (body.event === 'invitee.canceled') {
      // A reschedule cancels the old invitee and creates a new one; only a real cancel counts,
      // and only for the booking we have on file.
      if (!p.rescheduled && (!link.calendly_invitee_uri || link.calendly_invitee_uri === p.uri)) {
        await markAppointmentCanceled(db, link.id);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Calendly webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
