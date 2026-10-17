import { Client } from '@libsql/client';

export const CONTACT_QUALIFIER_COLUMNS = ['industry', 'business_stage', 'budget', 'timeline', 'website', 'lead_fit', 'role'] as const;

export async function initializeTables(db: Client): Promise<void> {
  try {
    // Create free_video_offers table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS free_video_offers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        business_name TEXT NOT NULL,
        sales_range TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create contacts table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        message TEXT,
        completion_status TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        source_page TEXT,
        biggest_challenge TEXT,
        services_interested TEXT,
        business_name TEXT
      )
    `);

    // Client onboarding links: one row per client, answers as JSON, logins encrypted in `credentials`.
    await db.execute(`
      CREATE TABLE IF NOT EXISTS client_onboardings (
        id TEXT PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        client_name TEXT NOT NULL,
        business_name TEXT,
        client_email TEXT,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'sent',
        current_step INTEGER NOT NULL DEFAULT 0,
        answers TEXT,
        credentials TEXT,
        admin_notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        opened_at TEXT,
        submitted_at TEXT
      )
    `);

    // `kind` (website | social) arrived after the first links went out; those stay NULL = "full".
    const onboardingCols = await db.execute('PRAGMA table_info(client_onboardings)');
    if (!onboardingCols.rows.some((r) => String(r.name) === 'kind')) {
      await db.execute('ALTER TABLE client_onboardings ADD COLUMN kind TEXT');
    }
    // Onboarding only goes to paying clients; this is when the team confirmed payment.
    if (!onboardingCols.rows.some((r) => String(r.name) === 'paid_at')) {
      await db.execute('ALTER TABLE client_onboardings ADD COLUMN paid_at TEXT');
    }

    // Every branded email the CRM sends (onboarding links, Zoom links, any link), for each person's history.
    await db.execute(`
      CREATE TABLE IF NOT EXISTS crm_messages (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        to_email TEXT NOT NULL,
        to_name TEXT,
        subject TEXT NOT NULL,
        link TEXT,
        source TEXT,
        source_id TEXT,
        onboarding_id TEXT,
        sent_at TEXT NOT NULL
      )
    `);
    await db.execute('CREATE INDEX IF NOT EXISTS idx_crm_messages_email ON crm_messages(to_email)');

    // Qualification columns added after the table first shipped; add any that are missing.
    const existing = await db.execute('PRAGMA table_info(contacts)');
    const have = new Set(existing.rows.map((r) => String(r.name)));
    // `logo` is the company logo the team uploads in the CRM, stored as a small data: URL.
    // `interests` is the comma list behind the interest buttons (lib/interests.ts); `deck` is the
    // team's edits to that contact's marketing-plan slides, as JSON (lib/deck.ts).
    for (const col of [...CONTACT_QUALIFIER_COLUMNS, 'logo', 'interests', 'deck']) {
      if (!have.has(col)) {
        await db.execute(`ALTER TABLE contacts ADD COLUMN ${col} TEXT`);
      }
    }
  } catch (err) {
    console.error('Failed to initialize tables:', err);
  }
}
