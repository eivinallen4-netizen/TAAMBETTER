import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';

const VALID_SORT_COLUMNS = ['created_at', 'name', 'business_name'];
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
      : 'created_at';
    const dir = VALID_DIRECTIONS.includes(url.searchParams.get('dir') || '')
      ? url.searchParams.get('dir')!
      : 'desc';

    const db = getAdminDb();
    await initializeTables(db);
    const searchPattern = `%${search}%`;

    // Get total count
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM free_video_offers
            WHERE ? = '' OR name LIKE ? OR business_name LIKE ? OR phone LIKE ?`,
      args: [search, searchPattern, searchPattern, searchPattern],
    });

    const total = (countResult.rows[0] as any).count;

    // Get paginated results
    const result = await db.execute({
      sql: `SELECT id, name, phone, business_name, sales_range, created_at
            FROM free_video_offers
            WHERE ? = '' OR name LIKE ? OR business_name LIKE ? OR phone LIKE ?
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
    console.error('Leads fetch error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
