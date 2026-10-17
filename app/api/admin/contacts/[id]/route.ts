import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { CONTACT_FIELDS } from '@/lib/contacts';
import { LOGO_VERSION_SQL, cleanLogo } from '@/lib/contact-logo';
import { inferInterests, joinInterests } from '@/lib/interests';

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
  'industry',
  'business_stage',
  'budget',
  'timeline',
  'website',
  'lead_fit',
  'role',
  'interests',
];

// Everything on the row except the logo itself, which is served as an image.
const RETURN_COLUMNS = `id, ${CONTACT_FIELDS.join(', ')}, ${LOGO_VERSION_SQL}`;

/** Contacts saved before interests existed get them suggested from their data until someone picks. */
function withSuggestions(row: Record<string, unknown>) {
  const str = (k: string) => (row[k] == null ? '' : String(row[k]));
  return {
    ...row,
    interests_suggested: str('interests')
      ? ''
      : inferInterests({
          source_page: str('source_page'),
          services_interested: str('services_interested'),
          biggest_challenge: str('biggest_challenge'),
          message: str('message'),
        }).join(', '),
  };
}

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
      sql: `SELECT ${RETURN_COLUMNS} FROM contacts WHERE id = ?`,
      args: [id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json(withSuggestions(result.rows[0] as Record<string, unknown>));
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
        // 'none' remembers that the team switched them all off, so suggestions don't come back.
        if (field === 'interests') value = joinInterests(Array.isArray(value) ? value : String(value ?? '').split(',')) || 'none';
        updates[field] = value;
      }
    }
    if ('logo' in body) {
      const logo = cleanLogo(body.logo);
      if (logo === null) {
        return NextResponse.json({ error: 'Logo must be a PNG, JPG or WebP image under 300 KB' }, { status: 400 });
      }
      updates.logo = logo;
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
      sql: `UPDATE contacts SET ${setClause} WHERE id = ? RETURNING ${RETURN_COLUMNS}`,
      args: values,
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json(withSuggestions(result.rows[0] as Record<string, unknown>));
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
