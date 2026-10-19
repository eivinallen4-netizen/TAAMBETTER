import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { createRateLimiter, handleRateLimit } from '@/lib/ratelimit';
import { getClientIp } from '@/lib/logger';
import { getAppointmentLinkByToken, markAppointmentBooked, markAppointmentOpened } from '@/lib/appointments';
import { getInvitee, getScheduledEvent, inviteePhone } from '@/lib/calendly';

// Public, behind the /call/[token] link. The page posts "opened" from the browser (so link
// previews in iMessage/Slack don't count as opens) and "scheduled" when Calendly says they booked.
// Booking details are read back from Calendly's API, never trusted from the browser.

const callLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 60 });

const CALENDLY_INVITEE_RE = /^https:\/\/api\.calendly\.com\/scheduled_events\/[A-Za-z0-9-]+\/invitees\/[A-Za-z0-9-]+$/;

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const limit = callLimiter(request, `call:${getClientIp(request.headers)}`);
  if (!limit.allowed) return handleRateLimit(limit.resetTime!);

  const { token } = await params;
  let body: { event?: unknown; inviteeUri?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    await initializeTables(db);
    const link = await getAppointmentLinkByToken(db, token);
    if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (body.event === 'opened') {
      // The team previewing a link isn't the prospect opening it.
      if (!(await getAdminSession())) await markAppointmentOpened(db, link.id);
      return NextResponse.json({ ok: true });
    }

    if (body.event === 'scheduled') {
      const inviteeUri = typeof body.inviteeUri === 'string' && CALENDLY_INVITEE_RE.test(body.inviteeUri) ? body.inviteeUri : '';
      if (inviteeUri && process.env.CALENDLY_TOKEN) {
        try {
          const invitee = await getInvitee(inviteeUri);
          // Only take it if this booking was made from this link.
          if (invitee.tracking?.utm_content === token) {
            const event = await getScheduledEvent(invitee.event);
            await markAppointmentBooked(db, link.id, {
              callStart: event.start_time,
              callEnd: event.end_time,
              email: invitee.email,
              name: invitee.name,
              phone: inviteePhone(invitee),
              eventUri: event.uri,
              inviteeUri: invitee.uri,
            });
            return NextResponse.json({ ok: true, callStart: event.start_time });
          }
        } catch (err) {
          console.error('Calendly lookup failed, the webhook will fill it in:', err);
        }
      }
      await markAppointmentBooked(db, link.id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unknown event' }, { status: 400 });
  } catch (error) {
    console.error('Call link event error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
