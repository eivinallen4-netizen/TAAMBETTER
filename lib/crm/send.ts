import { randomUUID } from 'crypto';
import type { Client } from '@libsql/client';
import { sendBrandEmail } from '@/lib/brand-email';
import { renderCrmEmail } from '@/lib/crm-email';
import { createOnboarding, findOpenOnboarding, onboardingUrl } from '@/lib/onboarding-store';
import { MESSAGE_META, RECIPIENT_SOURCES, isMessageType, type RecipientSource } from '@/app/lib/crm-messages';

// One branded email from the CRM: an onboarding link (paid clients only), a Zoom link, or any link.
// Shared by /api/admin/send, the REST API and the MCP tools. Throws SendError for bad input.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class SendError extends Error {}

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export interface SendResult {
  ok: true;
  subject: string;
  link: string;
  onboardingId: string | null;
  sentAt: string;
}

export async function sendCrmMessage(db: Client, body: Record<string, unknown>, origin: string): Promise<SendResult> {
  const type = body.type;
  if (!isMessageType(type)) throw new SendError('Pick what to send');
  const meta = MESSAGE_META[type];

  const email = str(body.email, 200);
  const name = str(body.name, 120);
  const businessName = str(body.businessName, 160);
  const note = str(body.note, 1500);
  const when = str(body.when, 120);
  const title = str(body.title, 120);
  const firstName = name.split(/\s+/)[0] ?? '';

  if (!EMAIL_RE.test(email)) throw new SendError('A valid email is required');
  const source: RecipientSource = RECIPIENT_SOURCES.includes(body.source as RecipientSource) ? (body.source as RecipientSource) : 'manual';
  const sourceId = str(body.sourceId, 64);

  if (meta.needsPaid && body.paid !== true) {
    throw new SendError('Onboarding is for paid clients. Confirm they have paid first.');
  }

  let link = str(body.link, 1000);
  if (meta.needsLink && !/^https?:\/\/\S+$/i.test(link)) {
    throw new SendError('Paste a full link starting with https://');
  }

  // Onboarding: reuse their open link if they already have one, so nobody ends up with two.
  let onboardingId: string | null = null;
  if (type === 'website_onboarding' || type === 'social_onboarding') {
    if (!name) throw new SendError("Client's name is required");
    const kind = type === 'website_onboarding' ? 'website' : 'social';
    const now = new Date().toISOString();
    const existing = await findOpenOnboarding(db, email, kind);
    if (existing) {
      await db.execute({
        sql: `UPDATE client_onboardings SET paid_at = COALESCE(paid_at, ?), message = CASE WHEN ? <> '' THEN ? ELSE message END, updated_at = ? WHERE id = ?`,
        args: [now, note, note, now, existing.id],
      });
      onboardingId = existing.id;
      link = onboardingUrl(existing.token, origin);
    } else {
      const created = await createOnboarding(db, { kind, clientName: name, businessName, email, message: note, paid: true });
      onboardingId = created.id;
      link = onboardingUrl(created.token, origin);
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

  return { ok: true, subject, link, onboardingId, sentAt };
}
