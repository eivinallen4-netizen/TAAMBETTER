import { randomUUID } from 'crypto';
import type { Client } from '@libsql/client';
import { inferInterests, joinInterests, parseInterests } from './interests';

// One row per email address. The contact form posts twice (partial, then complete), and the same
// person can come back through a free tool, so every save merges into the existing row instead of
// adding another one.

export const CONTACT_FIELDS = [
  'name',
  'email',
  'phone',
  'message',
  'completion_status',
  'timestamp',
  'source_page',
  'biggest_challenge',
  'services_interested',
  'business_name',
  'industry',
  'business_stage',
  'budget',
  'timeline',
  'website',
  'lead_fit',
  'role',
  'interests',
] as const;

export type ContactField = (typeof CONTACT_FIELDS)[number];
export type ContactValues = Partial<Record<ContactField, string>>;

/** Folds `incoming` into `existing`: blanks never overwrite, messages pile up, "complete"/"paid" stick. */
export function mergeContact(existing: ContactValues, incoming: ContactValues): ContactValues {
  const merged: ContactValues = { ...existing };
  for (const field of CONTACT_FIELDS) {
    const next = (incoming[field] ?? '').trim();
    if (!next) continue;
    const prev = (existing[field] ?? '').trim();
    if (field === 'message') {
      if (!prev || next.includes(prev)) merged.message = next;
      else if (!prev.includes(next)) merged.message = `${prev}\n\n${next}`;
    } else if (field === 'interests') {
      // Interests only ever add up; switching one off is done by hand in the CRM.
      merged.interests = joinInterests([...parseInterests(prev), ...parseInterests(next)]);
    } else if (field === 'completion_status') {
      // "paid" (set in the CRM) and "complete" never slide back to "partial".
      merged.completion_status = prev === 'paid' || prev === 'complete' ? prev : next;
    } else {
      merged[field] = next;
    }
  }
  return merged;
}

/** Inserts the contact, or merges it into the row that already has this email. Returns the row id. */
export async function saveContact(db: Client, incoming: ContactValues): Promise<string> {
  // Fill in what they're interested in from where they came from and what they told us.
  const contact: ContactValues = {
    ...incoming,
    interests: joinInterests([...parseInterests(incoming.interests), ...inferInterests(incoming)]),
  };
  const email = (contact.email ?? '').trim();
  if (email) {
    const found = await db.execute({
      sql: `SELECT id, ${CONTACT_FIELDS.join(', ')} FROM contacts WHERE lower(trim(email)) = lower(?) ORDER BY timestamp ASC LIMIT 1`,
      args: [email],
    });
    const row = found.rows[0];
    if (row) {
      const existing: ContactValues = {};
      for (const field of CONTACT_FIELDS) existing[field] = row[field] == null ? '' : String(row[field]);
      const merged = mergeContact(existing, contact);
      await db.execute({
        sql: `UPDATE contacts SET ${CONTACT_FIELDS.map((f) => `${f} = ?`).join(', ')} WHERE id = ?`,
        args: [...CONTACT_FIELDS.map((f) => merged[f] ?? ''), String(row.id)],
      });
      return String(row.id);
    }
  }

  const id = randomUUID();
  await db.execute({
    sql: `INSERT INTO contacts (id, ${CONTACT_FIELDS.join(', ')}) VALUES (?, ${CONTACT_FIELDS.map(() => '?').join(', ')})`,
    args: [id, ...CONTACT_FIELDS.map((f) => contact[f] ?? '')],
  });
  return id;
}
