import type { Migration } from '@taam/crm/server';

// The client CRM installs TAAM looks after. One row per install: where it lives, its API key
// (encrypted, see crypto.ts), and the last summary it sent back, so the screen shows the last
// known numbers even while an install is down.

export const installMigrations: Migration[] = [
  {
    id: '9100_taam_client_installs',
    statements: [
      `CREATE TABLE IF NOT EXISTS taam_client_installs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        site_url TEXT NOT NULL,
        api_path TEXT NOT NULL DEFAULT '',
        admin_url TEXT NOT NULL DEFAULT '',
        key_enc TEXT NOT NULL,
        key_hint TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'unknown',
        last_error TEXT NOT NULL DEFAULT '',
        version TEXT NOT NULL DEFAULT '',
        summary TEXT NOT NULL DEFAULT '',
        last_checked_at TEXT,
        last_ok_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS taam_client_installs_site ON taam_client_installs (site_url)`,
    ],
  },
];
