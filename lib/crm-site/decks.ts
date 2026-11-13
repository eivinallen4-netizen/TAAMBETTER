import type { Client } from '@libsql/client';
import type { Migration } from '@taam/crm/server';
import { inferInterests } from '@/lib/interests';
import { parseOverrides, type DeckOverrides } from '@/lib/deck';

// Personalized client slides (/admin/contacts/[id]/deck). The lead itself lives in the CRM
// (crm_clients + crm_agency_profiles, same id the old contacts table used); the saved slide
// edits and the company logo are the website's own, kept in taam_decks by that same id.

export const deckMigrations: Migration[] = [
  {
    id: '9000_taam_site_decks',
    statements: [
      `CREATE TABLE IF NOT EXISTS taam_decks (
        client_id TEXT PRIMARY KEY,
        deck TEXT NOT NULL DEFAULT '',
        logo TEXT NOT NULL DEFAULT '',
        updated_at TEXT NOT NULL
      )`,
    ],
  },
];

const LOGO_VERSION_SQL = `CASE WHEN d.logo IS NULL OR d.logo = '' THEN '' ELSE length(d.logo) || '-' || substr(d.logo, -10) END`;

let adopted: Promise<void> | null = null;

/**
 * Brings over the slides and logos saved on the old contacts table, once per server process.
 * Rows already in taam_decks are never replaced, so it is safe to run again and again.
 */
export function adoptOldDecks(db: Client): Promise<void> {
  adopted ??= (async () => {
    const info = await db.execute('PRAGMA table_info(contacts)');
    const columns = new Set(info.rows.map((r) => String(r.name)));
    if (!columns.has('id') || (!columns.has('deck') && !columns.has('logo'))) return;
    const deck = columns.has('deck') ? `COALESCE(deck, '')` : `''`;
    const logo = columns.has('logo') ? `COALESCE(logo, '')` : `''`;
    await db.execute({
      sql: `INSERT OR IGNORE INTO taam_decks (client_id, deck, logo, updated_at)
            SELECT id, ${deck}, ${logo}, ? FROM contacts WHERE ${deck} <> '' OR ${logo} <> ''`,
      args: [new Date().toISOString()],
    });
  })().catch((error) => {
    adopted = null;
    throw error;
  });
  return adopted;
}

export interface DeckLead {
  id: string;
  name: string;
  email: string;
  business_name: string;
  budget: string;
  biggest_challenge: string;
  message: string;
  interests: string;
  interests_suggested: string;
  logo_v: string;
}

/** What the slides page needs: the lead as the deck reads it, and the saved edits. Null when there is no such lead. */
export async function loadDeck(db: Client, id: string): Promise<{ contact: DeckLead; overrides: DeckOverrides } | null> {
  await adoptOldDecks(db);
  const result = await db.execute({
    sql: `SELECT c.id, c.first_name, c.last_name, c.company_name, c.email,
                 p.budget, p.biggest_challenge, p.message, p.interests, p.source_page, p.services_interested,
                 d.deck, ${LOGO_VERSION_SQL} AS logo_v
          FROM crm_clients c
          LEFT JOIN crm_agency_profiles p ON p.client_id = c.id
          LEFT JOIN taam_decks d ON d.client_id = c.id
          WHERE c.id = ?`,
    args: [id],
  });
  const row = result.rows[0];
  if (!row) return null;
  const str = (k: string) => (row[k] == null ? '' : String(row[k]));
  const interests = str('interests');
  return {
    contact: {
      id: str('id'),
      name: [str('first_name'), str('last_name')].filter(Boolean).join(' '),
      email: str('email'),
      business_name: str('company_name'),
      budget: str('budget'),
      biggest_challenge: str('biggest_challenge'),
      message: str('message'),
      interests,
      interests_suggested: interests
        ? ''
        : inferInterests({
            source_page: str('source_page'),
            services_interested: str('services_interested'),
            biggest_challenge: str('biggest_challenge'),
            message: str('message'),
          }).join(', '),
      logo_v: str('logo_v'),
    },
    overrides: parseOverrides(row.deck),
  };
}

async function leadExists(db: Client, id: string): Promise<boolean> {
  const found = await db.execute({ sql: 'SELECT 1 FROM crm_clients WHERE id = ?', args: [id] });
  return found.rows.length > 0;
}

/** Saves the slide edits ('' resets the deck to the defaults). False when there is no such lead. */
export async function saveDeck(db: Client, id: string, deck: string): Promise<boolean> {
  await adoptOldDecks(db);
  if (!(await leadExists(db, id))) return false;
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO taam_decks (client_id, deck, logo, updated_at) VALUES (?, ?, '', ?)
          ON CONFLICT (client_id) DO UPDATE SET deck = excluded.deck, updated_at = excluded.updated_at`,
    args: [id, deck, now],
  });
  return true;
}

/** Saves the company logo ('' clears it) and returns its new version. Null when there is no such lead. */
export async function saveLogo(db: Client, id: string, logo: string): Promise<string | null> {
  await adoptOldDecks(db);
  if (!(await leadExists(db, id))) return null;
  const now = new Date().toISOString();
  await db.execute({
    sql: `INSERT INTO taam_decks (client_id, deck, logo, updated_at) VALUES (?, '', ?, ?)
          ON CONFLICT (client_id) DO UPDATE SET logo = excluded.logo, updated_at = excluded.updated_at`,
    args: [id, logo, now],
  });
  const version = await db.execute({ sql: `SELECT ${LOGO_VERSION_SQL} AS logo_v FROM taam_decks d WHERE d.client_id = ?`, args: [id] });
  return String(version.rows[0]?.logo_v ?? '');
}

export async function readLogo(db: Client, id: string): Promise<string> {
  await adoptOldDecks(db);
  const result = await db.execute({ sql: 'SELECT logo FROM taam_decks WHERE client_id = ?', args: [id] });
  return String(result.rows[0]?.logo ?? '');
}

/** Leads for the "Client slides" list: who they are and whether their slides were edited. */
export async function listDeckLeads(db: Client): Promise<{ id: string; name: string; business_name: string; edited: boolean; logo_v: string }[]> {
  await adoptOldDecks(db);
  const result = await db.execute(
    `SELECT c.id, c.display_name, c.company_name, COALESCE(d.deck, '') AS deck, ${LOGO_VERSION_SQL} AS logo_v
     FROM crm_clients c
     JOIN crm_agency_profiles p ON p.client_id = c.id
     LEFT JOIN taam_decks d ON d.client_id = c.id
     WHERE c.archived_at IS NULL
     ORDER BY c.updated_at DESC
     LIMIT 300`
  );
  return result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.display_name ?? ''),
    business_name: String(row.company_name ?? ''),
    edited: String(row.deck ?? '') !== '' && String(row.deck) !== '{}',
    logo_v: String(row.logo_v ?? ''),
  }));
}
