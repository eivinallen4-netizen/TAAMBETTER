import { randomUUID } from 'crypto';
import { z } from 'zod';
import { defineOp, OpError, type OpContext, type Operation } from '@taam/crm/server';
import { sendBrandEmail } from '@/lib/brand-email';
import { renderCrmEmail } from '@/lib/crm-email';
import { MESSAGE_META, MESSAGE_TYPES, type MessageType } from '@/app/lib/crm-messages';
import { inferInterests } from '@/lib/interests';

// TAAM's own branded emails (an onboarding link for a paid client, a Zoom link, any link) and the
// interest guess, as CRM operations under the names Claude already uses. The emails keep the TAAM
// design (lib/crm-email.ts); onboarding links are made by the CRM, and every send goes in the CRM's
// message log so it shows on the lead.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const trimmed = (max: number) => z.string().trim().max(max).optional();

async function callCrm(name: string, input: unknown, ctx: OpContext): Promise<Record<string, unknown>> {
  const { crm } = await import('@/crm');
  return (await crm.call(name, input, ctx)) as Record<string, unknown>;
}

async function logSend(
  ctx: OpContext,
  m: { type: MessageType; to: string; toName: string; subject: string; body: string; contactId: string; status: 'sent' | 'failed' | 'skipped'; error: string }
) {
  await ctx.db.execute({
    sql: `INSERT INTO crm_message_log (id, channel, kind, to_addr, to_name, subject, body, entity_type, entity_id, status, provider_id, error, created_by, created_at)
          VALUES (?, 'email', ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?)`,
    args: [randomUUID(), m.type, m.to, m.toName, m.subject, m.body, m.contactId ? 'client' : '', m.contactId, m.status, m.error, ctx.actor.name, new Date().toISOString()],
  });
}

export function sendOperations(permission: string): Operation[] {
  return [
    defineOp({
      name: 'send_email',
      description:
        'Send a branded TAAM email. type: website_onboarding / social_onboarding (paid clients only, needs paid: true and name; makes or reuses their onboarding link), zoom (needs link, optional when), link (any URL, optional title as the button label). Returns { ok, subject, link, onboarding_id, sent_at }.',
      method: 'POST',
      path: '/send',
      permission,
      openWorld: true,
      input: z.object({
        type: z.enum(MESSAGE_TYPES).describe('What to send'),
        email: z.string().trim().max(200).describe('Recipient email'),
        name: trimmed(120).describe('Recipient name'),
        businessName: trimmed(160).describe('Their business'),
        link: trimmed(1000).describe('URL for zoom / link emails'),
        when: trimmed(120).describe('Zoom: when the call is, e.g. "Tue Oct 21, 2pm PT"'),
        title: trimmed(120).describe('Any link: what it is / Zoom: topic'),
        note: trimmed(1500).describe('A short personal note'),
        paid: z.boolean().optional().describe('Onboarding only: confirms they have paid'),
        contact_id: trimmed(64).describe('The CRM lead this is for, so it shows on their record'),
      }),
      run: async (input, ctx) => {
        const meta = MESSAGE_META[input.type];
        const email = input.email.toLowerCase();
        const name = input.name ?? '';
        const businessName = input.businessName ?? '';
        const contactId = input.contact_id ?? '';
        if (!EMAIL_RE.test(email)) throw new OpError(400, 'A valid email is required');
        if (meta.needsPaid && input.paid !== true) throw new OpError(400, 'Onboarding is for paid clients. Confirm they have paid first (paid: true).');

        let link = input.link ?? '';
        if (meta.needsLink && !/^https?:\/\/\S+$/i.test(link)) throw new OpError(400, 'Paste a full link starting with https://');

        // Onboarding: the CRM makes the link, or reuses their unfinished one so nobody holds two.
        let onboardingId: string | null = null;
        if (input.type === 'website_onboarding' || input.type === 'social_onboarding') {
          if (!name) throw new OpError(400, "Client's name is required");
          const made = await callCrm(
            'create_onboarding',
            {
              kind: input.type === 'website_onboarding' ? 'website' : 'social',
              client_id: contactId || undefined,
              client_name: name,
              business_name: businessName || undefined,
              client_email: email,
              message: input.note || undefined,
              paid: true,
              send_email: false,
            },
            ctx
          );
          const onboarding = made.onboarding as { id: string; url: string };
          onboardingId = onboarding.id;
          link = onboarding.url;
        }

        const { subject, html, text } = renderCrmEmail({
          type: input.type,
          firstName: name.split(/\s+/)[0] ?? '',
          businessName,
          link,
          when: input.when ?? '',
          title: input.title ?? '',
          note: input.note ?? '',
        });
        const log = { type: input.type, to: email, toName: name, subject, body: text, contactId };
        if (!process.env.RESEND_API_KEY) {
          await logSend(ctx, { ...log, status: 'skipped', error: 'Email is not set up yet (RESEND_API_KEY is missing)' });
          throw new OpError(503, 'Email is not set up yet (RESEND_API_KEY is missing)');
        }
        try {
          await sendBrandEmail({ to: email, subject, html, text, tag: input.type });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'The email did not send';
          await logSend(ctx, { ...log, status: 'failed', error: message });
          throw new OpError(502, message);
        }
        await logSend(ctx, { ...log, status: 'sent', error: '' });
        return { ok: true, subject, link, onboarding_id: onboardingId, sent_at: new Date().toISOString() };
      },
    }),
    defineOp({
      name: 'suggest_contact_interests',
      description: "Guess which TAAM services a contact is interested in from what's on their record. Returns { saved, suggested }.",
      method: 'GET',
      path: '/contacts/{id}/interests',
      permission,
      readOnly: true,
      input: z.object({ id: z.string().min(1).describe('Contact id') }),
      run: async ({ id }, ctx) => {
        const found = await callCrm('get_lead', { id }, ctx);
        const lead = found.lead as { interests: string[]; source_page: string; services_interested: string[]; biggest_challenge: string; message?: string };
        return {
          saved: lead.interests.join(','),
          suggested: inferInterests({
            source_page: lead.source_page,
            services_interested: lead.services_interested.join(','),
            biggest_challenge: lead.biggest_challenge,
            message: lead.message ?? '',
          }),
        };
      },
    }),
  ];
}
