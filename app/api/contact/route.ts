import { randomUUID } from 'crypto';
import { createClient } from '@libsql/client';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  completion_status: 'partial' | 'complete';
  timestamp: string;
  source_page: string;
  biggest_challenge?: string;
  services_interested?: string | string[];
  business_name?: string;
}

let db: ReturnType<typeof createClient> | null = null;

function getDb() {
  if (!db) {
    const TURSO_URL = process.env.TURSO_URL;
    const TURSO_TOKEN = process.env.TURSO_TOKEN;

    if (!TURSO_URL || !TURSO_TOKEN) {
      throw new Error('Turso not configured');
    }

    db = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    });
  }
  return db;
}

async function initializeTursoTable(): Promise<void> {
  try {
    const database = getDb();
    await database.execute(`
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
    console.error('Failed to initialize Turso table:', err);
  }
}

async function writeToTurso(contact: Contact): Promise<{ success: boolean; error?: string }> {
  try {
    const database = getDb();
    const servicesStr = Array.isArray(contact.services_interested)
      ? contact.services_interested.join(', ')
      : (contact.services_interested || '');

    await database.execute({
      sql: `INSERT INTO contacts (id, name, email, phone, message, completion_status, timestamp, source_page, biggest_challenge, services_interested, business_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        contact.id,
        contact.name,
        contact.email,
        contact.phone,
        contact.message,
        contact.completion_status,
        contact.timestamp,
        contact.source_page,
        contact.biggest_challenge || '',
        servicesStr,
        contact.business_name || '',
      ],
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown Turso error' };
  }
}

export async function POST(request: Request) {
  await initializeTursoTable();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const businessName = typeof body.business_name === 'string' ? body.business_name.trim() : '';
  const biggestChallenge = typeof body.biggest_challenge === 'string' ? body.biggest_challenge : '';
  const servicesInterested = Array.isArray(body.services_interested)
    ? body.services_interested.filter((s): s is string => typeof s === 'string')
    : [];
  const sourcePage = typeof body.source_page === 'string' ? body.source_page : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  // Trigger capture on name OR email (partial submission)
  const hasMinimalInfo = name.trim() !== '' || (email.trim() !== '' && EMAIL_RE.test(email));
  if (!hasMinimalInfo) {
    return Response.json({ error: 'At least name or valid email required' }, { status: 400 });
  }

  // Determine completion status
  const isComplete =
    name.trim() !== '' &&
    email.trim() !== '' &&
    EMAIL_RE.test(email) &&
    phone.replace(/\D/g, '').length >= 10 &&
    biggestChallenge !== '' &&
    servicesInterested.length > 0;

  const contact: Contact = {
    id: randomUUID(),
    name,
    email,
    phone,
    message,
    completion_status: isComplete ? 'complete' : 'partial',
    timestamp: new Date().toISOString(),
    source_page: sourcePage,
    ...(biggestChallenge && { biggest_challenge: biggestChallenge }),
    ...(servicesInterested.length > 0 && { services_interested: servicesInterested }),
    ...(businessName && { business_name: businessName }),
  };

  // Write to Turso - don't block on failure
  const tursoResult = await writeToTurso(contact);
  if (!tursoResult.success) {
    console.error('Turso write failed:', tursoResult.error);
  }

  return Response.json({ success: true, completion_status: contact.completion_status });
}
