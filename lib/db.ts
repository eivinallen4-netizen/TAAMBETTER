import { createClient } from '@libsql/client';

if (!process.env.TURSO_URL) {
  throw new Error('TURSO_URL environment variable is required');
}

if (!process.env.TURSO_TOKEN) {
  throw new Error('TURSO_TOKEN environment variable is required');
}

const client = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_TOKEN,
});

export default client;
