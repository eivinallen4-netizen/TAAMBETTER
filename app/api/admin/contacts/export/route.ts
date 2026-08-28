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
      sql: `SELECT id, name, email, phone, message, completion_status, timestamp, source_page, biggest_challenge, services_interested, business_name
            FROM contacts
            WHERE ? = '' OR name LIKE ? OR email LIKE ? OR business_name LIKE ?
            ORDER BY timestamp DESC`,
      args: [search, searchPattern, searchPattern, searchPattern],
    });

    const csv = toCsv(result.rows as any[], [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
      { key: 'phone', header: 'Phone' },
      { key: 'business_name', header: 'Business Name' },
      { key: 'message', header: 'Message' },
      { key: 'completion_status', header: 'Completion Status' },
      { key: 'timestamp', header: 'Timestamp' },
      { key: 'source_page', header: 'Source Page' },
      { key: 'biggest_challenge', header: 'Biggest Challenge' },
      { key: 'services_interested', header: 'Services Interested' },
    ]);

    const now = new Date().toISOString().split('T')[0];
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="contacts-${now}.csv"`,
      },
    });
  } catch (error) {
    console.error('Contacts export error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
