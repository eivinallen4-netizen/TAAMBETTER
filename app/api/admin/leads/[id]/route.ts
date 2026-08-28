import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';

const EDITABLE_FIELDS = ['name', 'phone', 'business_name', 'sales_range'];

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
      sql: 'SELECT * FROM free_video_offers WHERE id = ?',
      args: [id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Lead fetch error:', error);
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

    // Validate ID format (basic UUID check)
    if (!id.match(/^[a-f0-9\-]{36}$/i)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // Filter to editable fields only
    const updates: Record<string, string | number | null> = {};
    for (const field of EDITABLE_FIELDS) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const db = getAdminDb();
    await initializeTables(db);

    // Build dynamic UPDATE query
    const fields = Object.keys(updates);
    const placeholders = fields.map(() => '?').join(', ');
    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const values = [...Object.values(updates), id];

    const result = await db.execute({
      sql: `UPDATE free_video_offers SET ${setClause} WHERE id = ? RETURNING *`,
      args: values,
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Lead update error:', error);
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
    const result = await db.execute({
      sql: 'DELETE FROM free_video_offers WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lead delete error:', error);
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
