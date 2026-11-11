import { randomUUID } from 'crypto';
import { createClient } from '@libsql/client';
import { smsConsentRecord } from '@/app/lib/legal';

interface FreeVideoOffer {
  id: string;
  name: string;
  phone: string;
  business_name: string;
  sales_range: string;
  sms_consent: string;
  created_at: string;
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

async function initializeTable(): Promise<void> {
  try {
    const database = getDb();
    await database.execute(`
      CREATE TABLE IF NOT EXISTS free_video_offers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        business_name TEXT NOT NULL,
        sales_range TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Proof of text-message opt-in (app/lib/legal.ts), added after the table first shipped.
    const cols = await database.execute('PRAGMA table_info(free_video_offers)');
    if (!cols.rows.some((r) => String(r.name) === 'sms_consent')) {
      await database.execute('ALTER TABLE free_video_offers ADD COLUMN sms_consent TEXT');
    }
  } catch (err) {
    console.error('Failed to initialize free_video_offers table:', err);
  }
}

async function writeOffer(offer: FreeVideoOffer): Promise<{ success: boolean; error?: string }> {
  try {
    const database = getDb();

    await database.execute({
      sql: `INSERT INTO free_video_offers (id, name, phone, business_name, sales_range, sms_consent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        offer.id,
        offer.name,
        offer.phone,
        offer.business_name,
        offer.sales_range,
        offer.sms_consent,
        offer.created_at,
      ],
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function POST(request: Request) {
  await initializeTable();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const businessName = typeof body.business_name === 'string' ? body.business_name.trim() : '';
  const salesRange = typeof body.sales_range === 'string' ? body.sales_range.trim() : '';

  if (!name || !phone || !businessName || !salesRange) {
    return Response.json(
      { error: 'Missing required fields: name, phone, business_name, sales_range' },
      { status: 400 }
    );
  }

  const offer: FreeVideoOffer = {
    id: randomUUID(),
    name,
    phone,
    business_name: businessName,
    sales_range: salesRange,
    sms_consent: body.sms_consent === true ? smsConsentRecord('/free-video-offer') : '',
    created_at: new Date().toISOString(),
  };

  const result = await writeOffer(offer);
  if (!result.success) {
    console.error('Write failed:', result.error);
    return Response.json({ error: 'Failed to save offer' }, { status: 500 });
  }

  return Response.json({ success: true, id: offer.id });
}
