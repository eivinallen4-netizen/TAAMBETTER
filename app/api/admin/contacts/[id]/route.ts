import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';

const EDITABLE_FIELDS = [
  'name',
  'email',
  'phone',
  'message',
  'completion_status',
  'source_page',
  'biggest_challenge',
  'services_interested',
  'business_name',
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await Promise.resolve(params);

    // Validate ID format (basic UUID check)
    if (!id.match(/^[a-f0-9\-]{36}$/i)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const db = getAdminDb();
    await initializeTables(db);

    const result = await db.execute({
      sql: 'SELECT * FROM contacts WHERE id = ?',
      args: [id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Contact fetch error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await Promise.resolve(params);
    const body = await request.json();

    // Validate ID format (UUID)
    if (!id.match(/^[a-f0-9\-]{36}$/i)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // Filter to editable fields only
    const updates: Record<string, string | number | null> = {};
    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        let value = body[field];
        // Handle services_interested as comma-joined string if it's an array
        if (field === 'services_interested' && Array.isArray(value)) {
          value = value.join(', ');
        }
        updates[field] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const db = getAdminDb();
    await initializeTables(db);

    // Build dynamic UPDATE query
    const fields = Object.keys(updates);
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const values = [...Object.values(updates), id];

    const result = await db.execute({
      sql: `UPDATE contacts SET ${setClause} WHERE id = ? RETURNING *`,
      args: values,
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Contact update error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await Promise.resolve(params);

    // Validate ID format
    if (!id.match(/^[a-f0-9\-]{36}$/i)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const db = getAdminDb();
    await initializeTables(db);
    await db.execute({
      sql: 'DELETE FROM contacts WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact delete error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
