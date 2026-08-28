import { createClient, Client } from '@libsql/client';

let adminDbClient: Client | null = null;

export function getAdminDb(): Client {
  if (!adminDbClient) {
    if (!process.env.TURSO_URL || !process.env.TURSO_TOKEN) {
      throw new Error('Database not configured');
    }
    adminDbClient = createClient({
      url: process.env.TURSO_URL,
      authToken: process.env.TURSO_TOKEN,
    });
  }
  return adminDbClient;
}
