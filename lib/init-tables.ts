import { Client } from '@libsql/client';

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
  } catch (err) {
    console.error('Failed to initialize tables:', err);
  }
}
