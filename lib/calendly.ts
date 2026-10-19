import { createHmac, timingSafeEqual } from 'crypto';

// Calendly API v2 (https://developer.calendly.com). CALENDLY_TOKEN is a personal access token from
// the closer's Calendly account; CALENDLY_EVENT_URL is the event type prospects book;
// CALENDLY_WEBHOOK_SIGNING_KEY signs the webhook (scripts/calendly-webhook.mjs registers it).

const API = 'https://api.calendly.com';

export function calendlyEventUrl(): string {
  return (process.env.CALENDLY_EVENT_URL || '').trim();
}

export function calendlyConfigured() {
  return {
    token: Boolean(process.env.CALENDLY_TOKEN),
    eventUrl: Boolean(calendlyEventUrl()),
    webhookKey: Boolean(process.env.CALENDLY_WEBHOOK_SIGNING_KEY),
  };
}

export async function calendlyFetch<T = Record<string, unknown>>(pathOrUrl: string, init: RequestInit = {}): Promise<T> {
  const token = process.env.CALENDLY_TOKEN;
  if (!token) throw new Error('CALENDLY_TOKEN is not set');
  const url = pathOrUrl.startsWith('https://') ? pathOrUrl : `${API}${pathOrUrl}`;
  // Only ever send the token to Calendly itself.
  if (!url.startsWith(`${API}/`)) throw new Error('Not a Calendly API URL');
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Calendly ${res.status}: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export interface CalendlyInvitee {
  uri: string;
  email: string;
  name: string;
  event: string;
  status: string;
  text_reminder_number?: string | null;
  tracking?: { utm_content?: string | null; utm_source?: string | null } | null;
  rescheduled?: boolean;
  questions_and_answers?: { question: string; answer: string }[];
}

export interface CalendlyEvent {
  uri: string;
  start_time: string;
  end_time: string;
  status: string;
}

export async function getInvitee(uri: string): Promise<CalendlyInvitee> {
  return (await calendlyFetch<{ resource: CalendlyInvitee }>(uri)).resource;
}

export async function getScheduledEvent(uri: string): Promise<CalendlyEvent> {
  return (await calendlyFetch<{ resource: CalendlyEvent }>(uri)).resource;
}

/** A phone number from the invitee's text reminder or a "phone" question, if they gave one. */
export function inviteePhone(invitee: Pick<CalendlyInvitee, 'text_reminder_number' | 'questions_and_answers'>): string {
  if (invitee.text_reminder_number) return invitee.text_reminder_number;
  const q = invitee.questions_and_answers?.find((x) => /phone|cell|mobile/i.test(x.question));
  return q?.answer?.trim() ?? '';
}

/**
 * Checks the `Calendly-Webhook-Signature: t=…,v1=…` header: HMAC-SHA256 of "t.body" with the
 * signing key, and a timestamp no older than 3 minutes (replay protection).
 */
export function verifyWebhookSignature(header: string | null, rawBody: string, now = Date.now()): boolean {
  const key = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
  if (!key || !header) return false;
  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const i = p.indexOf('=');
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    })
  );
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1 || !/^\d+$/.test(t) || !/^[a-f0-9]{64}$/i.test(v1)) return false;
  if (Math.abs(now - Number(t) * 1000) > 3 * 60 * 1000) return false;
  const expected = createHmac('sha256', key).update(`${t}.${rawBody}`).digest('hex');
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(v1, 'hex'));
}
