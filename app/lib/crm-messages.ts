// What the CRM can send to someone already in it. Shared by the send modal and /api/admin/send.
// Onboarding is for paying clients only: the send form makes you confirm they've paid.

export const MESSAGE_TYPES = ['website_onboarding', 'social_onboarding', 'zoom', 'link'] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const MESSAGE_META: Record<MessageType, { label: string; hint: string; needsPaid: boolean; needsLink: boolean }> = {
  website_onboarding: {
    label: 'Website onboarding',
    hint: 'For paid clients. Creates their private link and emails it.',
    needsPaid: true,
    needsLink: false,
  },
  social_onboarding: {
    label: 'Social media onboarding',
    hint: 'For paid clients. Creates their private link and emails it.',
    needsPaid: true,
    needsLink: false,
  },
  zoom: {
    label: 'Zoom call',
    hint: 'Paste the Zoom (or Meet) link and the time.',
    needsPaid: false,
    needsLink: true,
  },
  link: {
    label: 'Any link',
    hint: 'A proposal, invoice, contract, video, anything with a URL.',
    needsPaid: false,
    needsLink: true,
  },
};

export function isMessageType(v: unknown): v is MessageType {
  return typeof v === 'string' && (MESSAGE_TYPES as readonly string[]).includes(v);
}

/** Where in the CRM the person came from, so the send shows up on their page. */
export const RECIPIENT_SOURCES = ['contact', 'lead', 'onboarding', 'manual'] as const;
export type RecipientSource = (typeof RECIPIENT_SOURCES)[number];

export interface SentMessage {
  id: string;
  type: MessageType;
  to_email: string;
  to_name: string;
  subject: string;
  link: string;
  sent_at: string;
}
