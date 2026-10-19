import type { Client } from '@libsql/client';
import { CONTACT_FIELDS, saveContact } from '@/lib/contacts';
import { inferInterests, joinInterests } from '@/lib/interests';
import {
  createAppointmentLink,
  getAppointmentLink,
  listAppointmentLinks,
  publicAppointment,
} from '@/lib/appointments';
import { createOnboarding, getOnboardingById, onboardingUrl, toOnboardingRow } from '@/lib/onboarding-store';
import { listTeam } from '@/lib/crm-users';
import { SendError, sendCrmMessage } from './send';

// Everything Claude (or any script) can do with the TAAM CRM, in one list. The REST API
// (/api/v1, app/api/v1/[...path]) routes to these by method + path, the MCP endpoint (/api/mcp)
// exposes them as tools, and /api/v1/openapi.json is generated from them. Add an operation here
// and it shows up in all three.

export class OpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface OpContext {
  db: Client;
  origin: string;
  /** Who's calling, for "made by" fields: the API key's name. */
  actor: { id: string; name: string };
}

type JsonSchema = Record<string, unknown>;

export interface Operation {
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** REST path under /api/v1, `{id}` for path params. */
  path: string;
  input: { type: 'object'; properties: Record<string, JsonSchema>; required?: string[] };
  /** MCP hint: doesn't change anything. */
  readOnly?: boolean;
  run: (input: Record<string, unknown>, ctx: OpContext) => Promise<unknown>;
}

const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : v == null ? '' : String(v).trim().slice(0, max));
const num = (v: unknown, def: number, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : def;
};
const UUID_RE = /^[a-f0-9-]{36}$/i;
function needId(input: Record<string, unknown>): string {
  const id = str(input.id, 64);
  if (!UUID_RE.test(id)) throw new OpError(400, 'A valid id is required');
  return id;
}

const S = (description: string, extra: JsonSchema = {}): JsonSchema => ({ type: 'string', description, ...extra });
const ID = { id: S('Record id (UUID)') };

// Contact columns that can be set through the API (not the timestamp, not the logo).
const CONTACT_WRITABLE = CONTACT_FIELDS.filter((f) => f !== 'timestamp');
const CONTACT_COLUMNS = `id, ${CONTACT_FIELDS.join(', ')}`;
const CONTACT_FILTERS: Record<string, string> = {
  paid: `completion_status = 'paid'`,
  strong: `lead_fit = 'strong'`,
  complete: `completion_status = 'complete'`,
  partial: `completion_status = 'partial'`,
  appointment: `source_page = 'Appointment link'`,
};

const contactProps: Record<string, JsonSchema> = {
  name: S('Full name'),
  email: S('Email address'),
  phone: S('Phone number'),
  business_name: S('Business name'),
  website: S('Business website URL'),
  social_url: S('Social media profile URL'),
  gbp_url: S('Google Business Profile URL'),
  message: S('Notes / message'),
  industry: S('Industry'),
  budget: S('Monthly marketing budget'),
  timeline: S('When they want to start'),
  lead_fit: S('Lead fit: strong, maybe, weak'),
  role: S('Their role at the business'),
  completion_status: S('partial, complete or paid'),
  source_page: S('Where they came from'),
  biggest_challenge: S('Their biggest marketing challenge'),
  services_interested: S('Services they asked about'),
  business_stage: S('Business stage'),
  interests: S('Comma list of interests: website, video, social, ads, seo, branding'),
};

function rows(result: { rows: unknown[] }) {
  return result.rows.map((r) => ({ ...(r as Record<string, unknown>) }));
}

export const OPERATIONS: Operation[] = [
  // ---------- Contacts ----------
  {
    name: 'search_contacts',
    description:
      'List or search CRM contacts (newest first). Search matches name, email, business, phone and website. Filters: paid, strong, complete, partial, appointment.',
    method: 'GET',
    path: '/contacts',
    readOnly: true,
    input: {
      type: 'object',
      properties: {
        search: S('Text to search for'),
        filter: S('Quick filter', { enum: Object.keys(CONTACT_FILTERS) }),
        limit: { type: 'integer', description: 'Max rows (default 50, max 500)' },
        offset: { type: 'integer', description: 'Rows to skip' },
      },
    },
    async run(input, { db }) {
      const search = str(input.search, 100);
      const like = `%${search}%`;
      const filter = CONTACT_FILTERS[str(input.filter)] ?? '1 = 1';
      const where = `(? = '' OR name LIKE ? OR email LIKE ? OR business_name LIKE ? OR phone LIKE ? OR website LIKE ?) AND ${filter}`;
      const args = [search, like, like, like, like, like];
      const limit = num(input.limit, 50, 1, 500);
      const offset = num(input.offset, 0, 0, 1_000_000);
      const [count, result] = await Promise.all([
        db.execute({ sql: `SELECT COUNT(*) AS n FROM contacts WHERE ${where}`, args }),
        db.execute({ sql: `SELECT ${CONTACT_COLUMNS} FROM contacts WHERE ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`, args: [...args, limit, offset] }),
      ]);
      return { total: Number(count.rows[0]?.n ?? 0), limit, offset, data: rows(result) };
    },
  },
  {
    name: 'get_contact',
    description: "One contact with everything on file, plus their appointment links and the emails the CRM has sent them.",
    method: 'GET',
    path: '/contacts/{id}',
    readOnly: true,
    input: { type: 'object', properties: ID, required: ['id'] },
    async run(input, { db, origin }) {
      const id = needId(input);
      const result = await db.execute({ sql: `SELECT ${CONTACT_COLUMNS} FROM contacts WHERE id = ?`, args: [id] });
      const contact = result.rows[0] as Record<string, unknown> | undefined;
      if (!contact) throw new OpError(404, 'Contact not found');
      const email = str(contact.email);
      const [links, messages] = await Promise.all([
        listAppointmentLinks(db, { contactId: id }),
        email
          ? db.execute({
              sql: 'SELECT id, type, subject, link, sent_at FROM crm_messages WHERE lower(to_email) = lower(?) ORDER BY sent_at DESC LIMIT 50',
              args: [email],
            })
          : Promise.resolve({ rows: [] }),
      ]);
      return {
        ...contact,
        appointment_links: links.map((l) => publicAppointment(l, origin)),
        messages: rows(messages),
      };
    },
  },
  {
    name: 'create_contact',
    description: 'Add a contact. If the email already exists, the details merge into that contact instead of making a duplicate.',
    method: 'POST',
    path: '/contacts',
    input: { type: 'object', properties: contactProps, required: ['name'] },
    async run(input, { db, actor }) {
      const name = str(input.name, 120);
      if (!name) throw new OpError(400, 'name is required');
      const email = str(input.email, 200);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new OpError(400, 'email is not valid');
      const values: Record<string, string> = {};
      for (const f of CONTACT_WRITABLE) if (input[f] != null) values[f] = str(input[f], f === 'message' ? 4000 : 500);
      const id = await saveContact(db, {
        ...values,
        name,
        email,
        completion_status: values.completion_status || 'complete',
        source_page: values.source_page || `Added by API (${actor.name})`,
        timestamp: new Date().toISOString(),
      });
      return { id };
    },
  },
  {
    name: 'update_contact',
    description: 'Change fields on a contact. Only the fields you send are changed.',
    method: 'PATCH',
    path: '/contacts/{id}',
    input: { type: 'object', properties: { ...ID, ...contactProps }, required: ['id'] },
    async run(input, { db }) {
      const id = needId(input);
      const updates: Record<string, string> = {};
      for (const f of CONTACT_WRITABLE) {
        if (input[f] === undefined) continue;
        updates[f] = f === 'interests' ? joinInterests(str(input[f]).split(',')) || 'none' : str(input[f], f === 'message' ? 4000 : 500);
      }
      const fields = Object.keys(updates);
      if (!fields.length) throw new OpError(400, 'Send at least one field to change');
      const result = await db.execute({
        sql: `UPDATE contacts SET ${fields.map((f) => `${f} = ?`).join(', ')} WHERE id = ? RETURNING ${CONTACT_COLUMNS}`,
        args: [...fields.map((f) => updates[f]), id],
      });
      if (!result.rows[0]) throw new OpError(404, 'Contact not found');
      return { ...(result.rows[0] as Record<string, unknown>) };
    },
  },
  {
    name: 'delete_contact',
    description: 'Permanently delete a contact. Cannot be undone.',
    method: 'DELETE',
    path: '/contacts/{id}',
    input: { type: 'object', properties: ID, required: ['id'] },
    async run(input, { db }) {
      const id = needId(input);
      const result = await db.execute({ sql: 'DELETE FROM contacts WHERE id = ?', args: [id] });
      if (!result.rowsAffected) throw new OpError(404, 'Contact not found');
      return { deleted: true };
    },
  },
  {
    name: 'suggest_contact_interests',
    description: "Guess which TAAM services a contact is interested in from what's on their record.",
    method: 'GET',
    path: '/contacts/{id}/interests',
    readOnly: true,
    input: { type: 'object', properties: ID, required: ['id'] },
    async run(input, { db }) {
      const id = needId(input);
      const r = await db.execute({ sql: 'SELECT interests, source_page, services_interested, biggest_challenge, message FROM contacts WHERE id = ?', args: [id] });
      const row = r.rows[0];
      if (!row) throw new OpError(404, 'Contact not found');
      return {
        saved: str(row.interests),
        suggested: inferInterests({
          source_page: str(row.source_page),
          services_interested: str(row.services_interested),
          biggest_challenge: str(row.biggest_challenge),
          message: str(row.message),
        }),
      };
    },
  },

  // ---------- Appointment links ----------
  {
    name: 'create_appointment_link',
    description:
      "Make an appointment link for a prospect: creates the contact and a private page made for their business where they book a video call on the closer's Calendly. Returns the URL to send them.",
    method: 'POST',
    path: '/appointments',
    input: {
      type: 'object',
      properties: {
        client_name: S("Prospect's name"),
        business_name: S('Business name'),
        social_url: S('Optional social media link'),
        gbp_url: S('Optional Google Business Profile link'),
        contact_id: S('Optional: an existing contact to attach the link to, instead of making a new contact'),
      },
      required: ['client_name', 'business_name'],
    },
    async run(input, { db, origin, actor }) {
      const clientName = str(input.client_name, 120);
      const businessName = str(input.business_name, 160);
      if (!clientName || !businessName) throw new OpError(400, 'client_name and business_name are required');
      const contactId = str(input.contact_id, 64);
      if (contactId && !UUID_RE.test(contactId)) throw new OpError(400, 'contact_id is not valid');
      try {
        const link = await createAppointmentLink(db, {
          clientName,
          businessName,
          socialUrl: str(input.social_url),
          gbpUrl: str(input.gbp_url),
          contactId: contactId || undefined,
          createdBy: `api:${actor.id}`,
          createdByName: actor.name,
        });
        return publicAppointment(link, origin);
      } catch (err) {
        if (err instanceof Error && err.message === 'Contact not found') throw new OpError(404, err.message);
        throw err;
      }
    },
  },
  {
    name: 'list_appointment_links',
    description: 'Appointment links, newest first, with when each was made, opened (and how often) and booked, and the call time.',
    method: 'GET',
    path: '/appointments',
    readOnly: true,
    input: {
      type: 'object',
      properties: {
        status: S('Only this status', { enum: ['sent', 'opened', 'booked', 'canceled'] }),
        search: S('Search prospect, business or setter name'),
        contact_id: S('Only links for this contact'),
        limit: { type: 'integer', description: 'Max rows (default 200)' },
      },
    },
    async run(input, { db, origin }) {
      const links = await listAppointmentLinks(db, {
        status: str(input.status) || undefined,
        search: str(input.search, 100) || undefined,
        contactId: str(input.contact_id, 64) || undefined,
        limit: num(input.limit, 200, 1, 1000),
      });
      return { data: links.map((l) => publicAppointment(l, origin)) };
    },
  },
  {
    name: 'get_appointment_link',
    description: 'One appointment link.',
    method: 'GET',
    path: '/appointments/{id}',
    readOnly: true,
    input: { type: 'object', properties: ID, required: ['id'] },
    async run(input, { db, origin }) {
      const link = await getAppointmentLink(db, needId(input));
      if (!link) throw new OpError(404, 'Appointment link not found');
      return publicAppointment(link, origin);
    },
  },

  // ---------- Onboarding ----------
  {
    name: 'list_onboardings',
    description: 'Client onboarding links (website or social media), with status and progress. Onboarding is for paid clients.',
    method: 'GET',
    path: '/onboarding',
    readOnly: true,
    input: { type: 'object', properties: { kind: S('Only this kind', { enum: ['website', 'social'] }) } },
    async run(input, { db, origin }) {
      const kind = str(input.kind);
      const result = await db.execute({
        sql: `SELECT * FROM client_onboardings ${kind === 'website' || kind === 'social' ? `WHERE kind = ? OR kind IS NULL` : ''} ORDER BY created_at DESC`,
        args: kind === 'website' || kind === 'social' ? [kind] : [],
      });
      return {
        data: result.rows.map((r) => {
          const row = toOnboardingRow(r as Record<string, unknown>);
          return {
            id: row.id,
            kind: row.kind,
            client_name: row.client_name,
            business_name: row.business_name,
            client_email: row.client_email,
            status: row.status,
            current_step: row.current_step,
            created_at: row.created_at,
            updated_at: row.updated_at,
            opened_at: row.opened_at,
            submitted_at: row.submitted_at,
            paid_at: row.paid_at,
            url: onboardingUrl(row.token, origin),
          };
        }),
      };
    },
  },
  {
    name: 'get_onboarding',
    description: "One onboarding with the client's answers. Saved passwords are never returned.",
    method: 'GET',
    path: '/onboarding/{id}',
    readOnly: true,
    input: { type: 'object', properties: ID, required: ['id'] },
    async run(input, { db, origin }) {
      const row = await getOnboardingById(db, needId(input));
      if (!row) throw new OpError(404, 'Onboarding not found');
      const { credentials, token, ...rest } = row;
      return { ...rest, has_saved_passwords: Boolean(credentials), url: onboardingUrl(token, origin) };
    },
  },
  {
    name: 'create_onboarding',
    description: 'Make an onboarding link for a PAID client (does not email it; use send_email for that). paid must be true.',
    method: 'POST',
    path: '/onboarding',
    input: {
      type: 'object',
      properties: {
        kind: S('website or social', { enum: ['website', 'social'] }),
        client_name: S("Client's name"),
        business_name: S('Business name'),
        email: S('Client email'),
        message: S('Note shown to the client'),
        paid: { type: 'boolean', description: 'Must be true: confirms the client has paid' },
      },
      required: ['kind', 'client_name', 'paid'],
    },
    async run(input, { db, origin }) {
      const kind = input.kind;
      if (kind !== 'website' && kind !== 'social') throw new OpError(400, 'kind must be website or social');
      if (input.paid !== true) throw new OpError(400, 'Onboarding is for paid clients. Confirm they have paid (paid: true).');
      const clientName = str(input.client_name, 120);
      if (!clientName) throw new OpError(400, 'client_name is required');
      const { id, token } = await createOnboarding(db, {
        kind,
        clientName,
        businessName: str(input.business_name, 160),
        email: str(input.email, 200),
        message: str(input.message, 1500),
        paid: true,
      });
      return { id, kind, url: onboardingUrl(token, origin) };
    },
  },

  // ---------- Email ----------
  {
    name: 'send_email',
    description:
      'Send a branded TAAM email. type: website_onboarding / social_onboarding (paid clients only, needs paid: true and name; makes or reuses their onboarding link), zoom (needs link, optional when), link (any URL, optional title as the button label).',
    method: 'POST',
    path: '/send',
    input: {
      type: 'object',
      properties: {
        type: S('What to send', { enum: ['website_onboarding', 'social_onboarding', 'zoom', 'link'] }),
        email: S('Recipient email'),
        name: S('Recipient name'),
        businessName: S('Their business'),
        link: S('URL for zoom / link emails'),
        when: S('Zoom: when the call is, e.g. "Tue Oct 21, 2pm PT"'),
        title: S('Any link: what it is / Zoom: topic'),
        note: S('A short personal note'),
        paid: { type: 'boolean', description: 'Onboarding only: confirms they have paid' },
        contact_id: S('The CRM contact this is for, so it shows on their record'),
      },
      required: ['type', 'email'],
    },
    async run(input, { db, origin }) {
      const contactId = str(input.contact_id, 64);
      try {
        return await sendCrmMessage(db, { ...input, source: contactId ? 'contact' : 'manual', sourceId: contactId }, origin);
      } catch (err) {
        if (err instanceof SendError) throw new OpError(400, err.message);
        throw err;
      }
    },
  },
  {
    name: 'list_messages',
    description: 'Branded emails the CRM has sent to an email address.',
    method: 'GET',
    path: '/messages',
    readOnly: true,
    input: { type: 'object', properties: { email: S('Email address') }, required: ['email'] },
    async run(input, { db }) {
      const email = str(input.email, 200);
      if (!email) throw new OpError(400, 'email is required');
      const result = await db.execute({
        sql: 'SELECT id, type, to_email, to_name, subject, link, sent_at FROM crm_messages WHERE lower(to_email) = lower(?) ORDER BY sent_at DESC LIMIT 100',
        args: [email],
      });
      return { data: rows(result) };
    },
  },

  // ---------- Leads, overview, team ----------
  {
    name: 'list_video_offer_leads',
    description: 'Free video offer sign-ups (name, phone, business, monthly sales range), newest first.',
    method: 'GET',
    path: '/leads',
    readOnly: true,
    input: {
      type: 'object',
      properties: { search: S('Search name, business or phone'), limit: { type: 'integer', description: 'Max rows (default 100)' } },
    },
    async run(input, { db }) {
      const search = str(input.search, 100);
      const like = `%${search}%`;
      const result = await db.execute({
        sql: `SELECT id, name, phone, business_name, sales_range, created_at FROM free_video_offers
              WHERE ? = '' OR name LIKE ? OR business_name LIKE ? OR phone LIKE ?
              ORDER BY created_at DESC LIMIT ?`,
        args: [search, like, like, like, num(input.limit, 100, 1, 1000)],
      });
      return { data: rows(result) };
    },
  },
  {
    name: 'get_overview',
    description: 'Pipeline snapshot: lead counts, this week, the appointment funnel (made → opened → booked), onboarding status counts, and upcoming calls.',
    method: 'GET',
    path: '/overview',
    readOnly: true,
    input: { type: 'object', properties: {} },
    async run(_input, { db, origin }) {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const now = new Date().toISOString();
      const [contacts, offers, appts, onboard, upcoming] = await Promise.all([
        db.execute({
          sql: `SELECT COUNT(*) AS total, SUM(CASE WHEN timestamp >= ? THEN 1 ELSE 0 END) AS week,
                       SUM(CASE WHEN completion_status = 'paid' THEN 1 ELSE 0 END) AS paid FROM contacts`,
          args: [weekAgo],
        }),
        db.execute('SELECT COUNT(*) AS total FROM free_video_offers'),
        db.execute(`SELECT status, COUNT(*) AS n, SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) AS opened FROM appointment_links GROUP BY status`),
        db.execute('SELECT kind, status, COUNT(*) AS n FROM client_onboardings GROUP BY kind, status'),
        db.execute({ sql: `SELECT * FROM appointment_links WHERE status = 'booked' AND call_start >= ? ORDER BY call_start ASC LIMIT 20`, args: [now] }),
      ]);
      const funnel = { made: 0, opened: 0, booked: 0, canceled: 0 };
      for (const r of appts.rows) {
        funnel.made += Number(r.n);
        funnel.opened += Number(r.opened);
        if (r.status === 'booked') funnel.booked += Number(r.n);
        if (r.status === 'canceled') funnel.canceled += Number(r.n);
      }
      const c = contacts.rows[0] ?? {};
      return {
        contacts: { total: Number(c.total ?? 0), added_this_week: Number(c.week ?? 0), paid: Number(c.paid ?? 0) },
        video_offer_leads: Number(offers.rows[0]?.total ?? 0),
        appointments: funnel,
        onboarding: rows(onboard),
        upcoming_calls: (await Promise.all(upcoming.rows.map(async (r) => getAppointmentLink(db, String(r.id))))).flatMap((l) =>
          l ? [publicAppointment(l, origin)] : []
        ),
      };
    },
  },
  {
    name: 'list_team',
    description: 'Team logins (appointment setters and admins). Passwords are never returned.',
    method: 'GET',
    path: '/team',
    readOnly: true,
    input: { type: 'object', properties: {} },
    async run(_input, { db }) {
      return { data: await listTeam(db) };
    },
  },
];

export function findOperation(name: string): Operation | undefined {
  return OPERATIONS.find((o) => o.name === name);
}

/** Matches a REST call to an operation, pulling `{id}`-style params out of the path. */
export function matchOperation(method: string, path: string): { op: Operation; params: Record<string, string> } | null {
  const parts = path.split('/').filter(Boolean);
  for (const op of OPERATIONS) {
    if (op.method !== method) continue;
    const pattern = op.path.split('/').filter(Boolean);
    if (pattern.length !== parts.length) continue;
    const params: Record<string, string> = {};
    const ok = pattern.every((seg, i) => {
      const m = /^\{(\w+)\}$/.exec(seg);
      if (m) {
        params[m[1]] = decodeURIComponent(parts[i]);
        return true;
      }
      return seg === parts[i];
    });
    if (ok) return { op, params };
  }
  return null;
}
