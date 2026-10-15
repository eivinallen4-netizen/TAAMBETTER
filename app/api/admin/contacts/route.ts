import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';

const VALID_SORT_COLUMNS = ['timestamp', 'name', 'email', 'business_name', 'lead_fit', 'budget'];
const VALID_DIRECTIONS = ['asc', 'desc'];

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

    const db = getAdminDb();
    await initializeTables(db);
    const searchPattern = `%${search}%`;

    // Get total count
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM contacts
            WHERE ? = '' OR name LIKE ? OR email LIKE ? OR business_name LIKE ?`,
      args: [search, searchPattern, searchPattern, searchPattern],
    });

    const total = (countResult.rows[0] as any).count;

    // Get paginated results
    const result = await db.execute({
      sql: `SELECT id, name, email, phone, message, completion_status, timestamp, source_page, biggest_challenge, services_interested, business_name, industry, business_stage, budget, timeline, website, lead_fit, role
            FROM contacts
            WHERE ? = '' OR name LIKE ? OR email LIKE ? OR business_name LIKE ?
            ORDER BY ${sort} ${dir}
            LIMIT ? OFFSET ?`,
      args: [search, searchPattern, searchPattern, searchPattern, limit, offset],
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
