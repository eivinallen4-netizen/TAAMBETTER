import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { saveContact } from '@/lib/contacts';
import { LOGO_VERSION_SQL, cleanLogo } from '@/lib/contact-logo';

const VALID_SORT_COLUMNS = ['timestamp', 'name', 'email', 'business_name', 'lead_fit', 'budget'];
const VALID_DIRECTIONS = ['asc', 'desc'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The quick filters on the contacts page.
const FILTERS: Record<string, string> = {
  paid: `completion_status = 'paid'`,
  strong: `lead_fit = 'strong'`,
  complete: `completion_status = 'complete'`,
  partial: `completion_status = 'partial'`,
};

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 1000);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const sort = VALID_SORT_COLUMNS.includes(url.searchParams.get('sort') || '')
      ? url.searchParams.get('sort')!
      : 'timestamp';
    const dir = VALID_DIRECTIONS.includes(url.searchParams.get('dir') || '')
      ? url.searchParams.get('dir')!
      : 'desc';

    const filter = FILTERS[url.searchParams.get('filter') || ''] ?? '1 = 1';

    const db = getAdminDb();
    await initializeTables(db);
    const searchPattern = `%${search}%`;
    const where = `(? = '' OR name LIKE ? OR email LIKE ? OR business_name LIKE ? OR phone LIKE ? OR website LIKE ?) AND ${filter}`;
    const whereArgs = [search, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern];

    // Get total count
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM contacts WHERE ${where}`,
      args: whereArgs,
    });

    const total = (countResult.rows[0] as any).count;

    // Get paginated results
    const result = await db.execute({
      sql: `SELECT id, name, email, phone, message, completion_status, timestamp, source_page, biggest_challenge, services_interested, business_name, industry, business_stage, budget, timeline, website, lead_fit, role, interests, ${LOGO_VERSION_SQL}
            FROM contacts
            WHERE ${where}
            ORDER BY ${sort} ${dir}
            LIMIT ? OFFSET ?`,
      args: [...whereArgs, limit, offset],
    });

    return NextResponse.json({
      data: result.rows,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Contacts fetch error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Adds someone by hand (met them in person, got a referral). Same email = merges into the existing contact. */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

    const name = str(body.name, 120);
    const email = str(body.email, 200);
    if (!name) return NextResponse.json({ error: 'Add their name' }, { status: 400 });
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    const logo = cleanLogo(body.logo ?? '');
    if (logo === null) {
      return NextResponse.json({ error: 'Logo must be a PNG, JPG or WebP image under 300 KB' }, { status: 400 });
    }

    const db = getAdminDb();
    await initializeTables(db);
    const id = await saveContact(db, {
      name,
      email,
      phone: str(body.phone, 40),
      business_name: str(body.business_name, 160),
      website: str(body.website, 300),
      message: str(body.message, 2000),
      completion_status: 'complete',
      timestamp: new Date().toISOString(),
      source_page: 'Added in CRM',
    });
    if (logo) await db.execute({ sql: 'UPDATE contacts SET logo = ? WHERE id = ?', args: [logo, id] });

    return NextResponse.json({ id });
  } catch (error) {
    console.error('Contact create error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
