import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { toCsv } from '@/lib/csv';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';

    const db = getAdminDb();
    await initializeTables(db);
    const searchPattern = `%${search}%`;

    const result = await db.execute({
      sql: `SELECT id, name, phone, business_name, sales_range, created_at
            FROM free_video_offers
            WHERE ? = '' OR name LIKE ? OR business_name LIKE ? OR phone LIKE ?
            ORDER BY created_at DESC`,
      args: [search, searchPattern, searchPattern, searchPattern],
    });

    const csv = toCsv(result.rows as any[], [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'phone', header: 'Phone' },
      { key: 'business_name', header: 'Business Name' },
      { key: 'sales_range', header: 'Sales Range' },
      { key: 'created_at', header: 'Created At' },
    ]);

    const now = new Date().toISOString().split('T')[0];
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-${now}.csv"`,
      },
    });
  } catch (error) {
    console.error('Leads export error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
