import { randomBytes, randomUUID } from 'crypto';
import type { Client } from '@libsql/client';
import { saveContact } from './contacts';

// Appointment links. A setter types the prospect's name and business (plus their social or
// Google Business link if they have it); that makes a CRM contact and a private /call/[token] page
// where the prospect books a video call on the closer's Calendly. The row tracks when the link was
// made, opened and booked. Bookings arrive on the Calendly webhook (app/api/calendly/webhook).

export type AppointmentStatus = 'sent' | 'opened' | 'booked' | 'canceled';

export interface AppointmentLink {
  id: string;
  token: string;
  contact_id: string | null;
  client_name: string;
  business_name: string;
  social_url: string;
  gbp_url: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  opened_at: string | null;
  last_opened_at: string | null;
  open_count: number;
  booked_at: string | null;
  call_start: string | null;
  call_end: string | null;
  invitee_email: string;
  calendly_invitee_uri: string | null;
  canceled_at: string | null;
  status: AppointmentStatus;
}

const STATUSES: AppointmentStatus[] = ['sent', 'opened', 'booked', 'canceled'];

export function toAppointmentLink(row: Record<string, unknown>): AppointmentLink {
  const s = (v: unknown) => (v == null ? '' : String(v));
  const n = (v: unknown) => (v == null || v === '' ? null : String(v));
  const status = s(row.status) as AppointmentStatus;
  return {
    id: s(row.id),
    token: s(row.token),
    contact_id: n(row.contact_id),
    client_name: s(row.client_name),
    business_name: s(row.business_name),
    social_url: s(row.social_url),
    gbp_url: s(row.gbp_url),
    created_by: s(row.created_by),
    created_by_name: s(row.created_by_name),
    created_at: s(row.created_at),
    opened_at: n(row.opened_at),
    last_opened_at: n(row.last_opened_at),
    open_count: Number(row.open_count ?? 0),
    booked_at: n(row.booked_at),
    call_start: n(row.call_start),
    call_end: n(row.call_end),
    invitee_email: s(row.invitee_email),
    calendly_invitee_uri: n(row.calendly_invitee_uri),
    canceled_at: n(row.canceled_at),
    status: STATUSES.includes(status) ? status : 'sent',
  };
}

export function appointmentUrl(token: string, origin?: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || origin || 'https://taammarketing.com';
  return `${base.replace(/\/$/, '')}/call/${token}`;
}

/** Only http(s) links are kept; a bare "instagram.com/x" gets https:// in front. */
export function cleanUrl(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim().slice(0, 500) : '';
  if (!raw) return '';
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

export interface NewAppointmentLink {
  clientName: string;
  businessName: string;
  socialUrl?: string;
  gbpUrl?: string;
  /** Attach to a contact already in the CRM instead of making a new one. */
  contactId?: string;
  /** Who made it: a crm_users id, 'admin', or 'api:<key name>'. */
  createdBy: string;
  createdByName: string;
}

/** Makes the contact and the link. Returns the new link row. */
export async function createAppointmentLink(db: Client, input: NewAppointmentLink): Promise<AppointmentLink> {
  const now = new Date().toISOString();
  const socialUrl = cleanUrl(input.socialUrl);
  const gbpUrl = cleanUrl(input.gbpUrl);
  let contactId = '';
  if (input.contactId) {
    const found = await db.execute({ sql: 'SELECT id FROM contacts WHERE id = ?', args: [input.contactId] });
    if (!found.rows[0]) throw new Error('Contact not found');
    contactId = input.contactId;
    // Fill in their social / Google links if the contact doesn't have them yet.
    await db.execute({
      sql: `UPDATE contacts SET social_url = CASE WHEN ? <> '' AND (social_url IS NULL OR social_url = '') THEN ? ELSE social_url END,
                                gbp_url = CASE WHEN ? <> '' AND (gbp_url IS NULL OR gbp_url = '') THEN ? ELSE gbp_url END
            WHERE id = ?`,
      args: [socialUrl, socialUrl, gbpUrl, gbpUrl, contactId],
    });
  } else contactId = await saveContact(db, {
    name: input.clientName,
    business_name: input.businessName,
    social_url: socialUrl,
    gbp_url: gbpUrl,
    completion_status: 'partial',
    timestamp: now,
    source_page: 'Appointment link',
    message: `Appointment link made by ${input.createdByName}.`,
  });

  const id = randomUUID();
  const token = randomBytes(18).toString('base64url');
  await db.execute({
    sql: `INSERT INTO appointment_links
            (id, token, contact_id, client_name, business_name, social_url, gbp_url, created_by, created_by_name, created_at, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent')`,
    args: [id, token, contactId, input.clientName, input.businessName, socialUrl, gbpUrl, input.createdBy, input.createdByName, now],
  });
  return (await getAppointmentLink(db, id))!;
}

export async function getAppointmentLink(db: Client, id: string): Promise<AppointmentLink | null> {
  const result = await db.execute({ sql: 'SELECT * FROM appointment_links WHERE id = ?', args: [id] });
  return result.rows[0] ? toAppointmentLink(result.rows[0] as Record<string, unknown>) : null;
}

export async function getAppointmentLinkByToken(db: Client, token: string): Promise<AppointmentLink | null> {
  if (!/^[A-Za-z0-9_-]{10,64}$/.test(token)) return null;
  const result = await db.execute({ sql: 'SELECT * FROM appointment_links WHERE token = ?', args: [token] });
  return result.rows[0] ? toAppointmentLink(result.rows[0] as Record<string, unknown>) : null;
}

export async function listAppointmentLinks(
  db: Client,
  opts: { createdBy?: string; contactId?: string; status?: string; search?: string; limit?: number } = {}
): Promise<AppointmentLink[]> {
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (opts.createdBy) {
    where.push('created_by = ?');
    args.push(opts.createdBy);
  }
  if (opts.contactId) {
    where.push('contact_id = ?');
    args.push(opts.contactId);
  }
  if (opts.status && STATUSES.includes(opts.status as AppointmentStatus)) {
    where.push('status = ?');
    args.push(opts.status);
  }
  if (opts.search) {
    where.push('(client_name LIKE ? OR business_name LIKE ? OR created_by_name LIKE ?)');
    const like = `%${opts.search}%`;
    args.push(like, like, like);
  }
  const limit = Math.max(1, Math.min(opts.limit ?? 500, 1000));
  const result = await db.execute({
    sql: `SELECT * FROM appointment_links ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT ?`,
    args: [...args, limit],
  });
  return result.rows.map((r) => toAppointmentLink(r as Record<string, unknown>));
}

/** Every visit counts; the first one stamps opened_at and moves "sent" to "opened". */
export async function markAppointmentOpened(db: Client, id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({
    sql: `UPDATE appointment_links
          SET opened_at = COALESCE(opened_at, ?), last_opened_at = ?, open_count = open_count + 1,
              status = CASE WHEN status = 'sent' THEN 'opened' ELSE status END
          WHERE id = ?`,
    args: [now, now, id],
  });
}

/**
 * The prospect finished booking. The page reports it right away (no times, those can't be trusted
 * from the browser); the webhook follows with the real call time and their email.
 */
export async function markAppointmentBooked(
  db: Client,
  id: string,
  details: { callStart?: string; callEnd?: string; email?: string; name?: string; phone?: string; eventUri?: string; inviteeUri?: string } = {}
): Promise<void> {
  const now = new Date().toISOString();
  await db.execute({
    sql: `UPDATE appointment_links
          SET status = 'booked', booked_at = COALESCE(booked_at, ?), canceled_at = NULL,
              call_start = COALESCE(?, call_start), call_end = COALESCE(?, call_end),
              invitee_email = COALESCE(?, invitee_email),
              calendly_event_uri = COALESCE(?, calendly_event_uri), calendly_invitee_uri = COALESCE(?, calendly_invitee_uri)
          WHERE id = ?`,
    args: [now, details.callStart || null, details.callEnd || null, details.email || null, details.eventUri || null, details.inviteeUri || null, id],
  });

  // What they typed into Calendly fills in the contact (blanks never overwrite).
  const link = await getAppointmentLink(db, id);
  if (link?.contact_id && (details.email || details.phone)) {
    await db.execute({
      sql: `UPDATE contacts
            SET email = CASE WHEN ? <> '' AND (email IS NULL OR email = '') THEN ? ELSE email END,
                phone = CASE WHEN ? <> '' AND (phone IS NULL OR phone = '') THEN ? ELSE phone END
            WHERE id = ?`,
      args: [details.email ?? '', details.email ?? '', details.phone ?? '', details.phone ?? '', link.contact_id],
    });
  }
}

export async function markAppointmentCanceled(db: Client, id: string): Promise<void> {
  await db.execute({
    sql: `UPDATE appointment_links SET status = 'canceled', canceled_at = ? WHERE id = ?`,
    args: [new Date().toISOString(), id],
  });
}

export async function deleteAppointmentLink(db: Client, id: string): Promise<void> {
  await db.execute({ sql: 'DELETE FROM appointment_links WHERE id = ?', args: [id] });
}

/** The shape the CRM and the API hand out: the row plus its public URL. */
export function publicAppointment(link: AppointmentLink, origin?: string) {
  const { token, ...rest } = link;
  return { ...rest, url: appointmentUrl(token, origin) };
}
