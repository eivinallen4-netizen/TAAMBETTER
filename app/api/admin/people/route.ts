import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';

// Everyone already in the CRM, for the "send to" picker. One row per email where there is one.

export interface Person {
  source: 'contact' | 'lead' | 'onboarding';
  id: string;
  name: string;
  email: string;
  phone: string;
  business: string;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const q = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 100);
    const like = `%${q}%`;
    const db = getAdminDb();
    await initializeTables(db);

    const [contacts, onboardings, leads] = await Promise.all([
      db.execute({
        sql: `SELECT id, name, email, phone, business_name FROM contacts
              WHERE name LIKE ? OR email LIKE ? OR business_name LIKE ? ORDER BY timestamp DESC LIMIT 25`,
        args: [like, like, like],
      }),
      db.execute({
        sql: `SELECT id, client_name, client_email, business_name FROM client_onboardings
              WHERE client_name LIKE ? OR client_email LIKE ? OR business_name LIKE ? ORDER BY updated_at DESC LIMIT 25`,
        args: [like, like, like],
      }),
      db.execute({
        sql: `SELECT id, name, phone, business_name FROM free_video_offers
              WHERE name LIKE ? OR phone LIKE ? OR business_name LIKE ? ORDER BY created_at DESC LIMIT 25`,
        args: [like, like, like],
      }),
    ]);

    const s = (v: unknown) => (v == null ? '' : String(v));
    const people: Person[] = [
      ...contacts.rows.map((r) => ({ source: 'contact' as const, id: s(r.id), name: s(r.name), email: s(r.email), phone: s(r.phone), business: s(r.business_name) })),
      ...onboardings.rows.map((r) => ({ source: 'onboarding' as const, id: s(r.id), name: s(r.client_name), email: s(r.client_email), phone: '', business: s(r.business_name) })),
      ...leads.rows.map((r) => ({ source: 'lead' as const, id: s(r.id), name: s(r.name), email: '', phone: s(r.phone), business: s(r.business_name) })),
    ];

    const seen = new Set<string>();
    const data = people.filter((p) => {
      const key = p.email ? p.email.toLowerCase() : `${p.source}:${p.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ data: data.slice(0, 30) });
  } catch (error) {
    console.error('People search error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
