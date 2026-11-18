import type { CrmEmailContent } from '@taam/crm';
import { FONT, MUTED, ORANGE, RULE, button, emailShell, esc, eyebrow, inkRow, paragraphs, type Mascot } from '@/lib/brand-email';

// The TAAM design for the emails @taam/crm sends on its own (bookings, reminders, e-sign, invoices,
// quotes, invites, onboarding, sign-in codes), plugged in through crm.ts `email.render`. Same shell
// as the site's own emails in lib/brand-email.ts. Every field arrives as plain text.

interface Look {
  eyebrow: string;
  mascot?: Mascot;
  footer: string;
}

const CLIENT = "You're getting this because you're working with TAAM.";
const STAFF = 'Sent by the TAAM CRM.';

/** Label, character and small print for each kind of email, by its `kind` prefix. */
function look(kind: string): Look {
  if (kind.startsWith('booking_host_')) return { eyebrow: 'Bookings', mascot: 'phone', footer: STAFF };
  if (kind === 'booking_reminder') return { eyebrow: 'Reminder', mascot: 'phone', footer: "You're getting this because you have a call booked with TAAM." };
  if (kind === 'booking_cancelled') return { eyebrow: 'Booking cancelled', mascot: 'phone', footer: "You're getting this because you had a call booked with TAAM." };
  if (kind.startsWith('booking_')) return { eyebrow: 'Your call', mascot: 'phone', footer: "You're getting this because you booked a call with TAAM." };
  if (kind === 'esign_completed') return { eyebrow: 'Signed', mascot: 'wave', footer: CLIENT };
  if (kind.startsWith('esign_')) return { eyebrow: 'Ready to sign', mascot: 'counting', footer: CLIENT };
  if (kind.startsWith('invoice')) return { eyebrow: 'Invoice', mascot: 'counting', footer: CLIENT };
  if (kind.startsWith('quote')) return { eyebrow: 'Your quote', mascot: 'counting', footer: CLIENT };
  if (kind === 'onboarding_submitted') return { eyebrow: 'Onboarding · Received', mascot: 'wave', footer: STAFF };
  if (kind.startsWith('onboarding')) return { eyebrow: 'Onboarding', mascot: 'wave', footer: "This link is private to you. Don't forward it." };
  if (kind === 'team_invite') return { eyebrow: 'Team invite', mascot: 'wave', footer: "You're getting this because someone at TAAM invited you to the CRM." };
  if (kind === 'sign_in_code') return { eyebrow: 'Sign in', footer: "Didn't ask to sign in? You can ignore this email." };
  if (kind === 'task_digest') return { eyebrow: "Today's tasks", mascot: 'counting', footer: STAFF };
  if (kind === 'request_notification') return { eyebrow: 'New request', mascot: 'phone', footer: STAFF };
  if (kind.startsWith('request')) return { eyebrow: 'Request received', mascot: 'wave', footer: CLIENT };
  return { eyebrow: 'From TAAM', footer: CLIENT };
}

export function renderCrmPackageEmail(e: CrmEmailContent): string {
  const l = look(e.kind);

  const inner = [
    paragraphs(e.paragraphs.join('\n\n'), `font:600 17px/1.6 ${FONT};color:#fff;`),
    e.button ? `<div style="padding-top:12px;">${button(e.button.label, e.button.url)}</div>` : '',
  ].join('');

  const rows = [
    e.note ? inkRow(`<div style="padding-top:20px;border-top:2px solid ${RULE};">${paragraphs(e.note, `font:500 15px/1.6 ${FONT};color:#e6e6e6;`)}</div>`, 40) : '',
    e.button
      ? inkRow(
          `${eyebrow('Button not working?', ORANGE)}<p style="margin:8px 0 0;font:500 12px/1.6 ${FONT};color:${MUTED};">Paste this into your browser:<br><a href="${esc(e.button.url)}" style="color:${ORANGE};word-break:break-all;">${esc(e.button.url)}</a></p>`,
          e.note ? 28 : 40
        )
      : '',
  ].join('');

  return emailShell({
    title: e.subject,
    preheader: e.paragraphs[0] ?? e.heading,
    hero: { eyebrow: l.eyebrow, title: e.heading, mascot: l.mascot, inner },
    rows,
    footer: l.footer,
  });
}
