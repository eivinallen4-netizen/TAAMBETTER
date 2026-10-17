import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { LOGO_VERSION_SQL } from '@/lib/contact-logo';
import { inferInterests } from '@/lib/interests';
import { cleanOverrides, parseOverrides, serializeOverrides } from '@/lib/deck';

// A contact's marketing-plan slides: GET returns what the deck page needs (the contact, its logo
// version and the saved edits), PUT saves the edits, DELETE resets the deck to the defaults.

const ID_RE = /^[a-f0-9\-]{36}$/i;

const CONTACT_COLUMNS = `id, name, email, business_name, budget, biggest_challenge, message, source_page, services_interested, interests, deck, ${LOGO_VERSION_SQL}`;

async function load(id: string) {
  const db = getAdminDb();
  await initializeTables(db);
  const result = await db.execute({
    sql: `SELECT ${CONTACT_COLUMNS} FROM contacts WHERE id = ?`,
    args: [id],
  });
  const row = result.rows[0];
  if (!row) return null;
  const str = (k: string) => (row[k] == null ? '' : String(row[k]));
  const interests = str('interests');
  return {
    contact: {
      id: str('id'),
      name: str('name'),
      email: str('email'),
      business_name: str('business_name'),
      budget: str('budget'),
      biggest_challenge: str('biggest_challenge'),
      message: str('message'),
      interests,
      interests_suggested: interests
        ? ''
        : inferInterests({
            source_page: str('source_page'),
            services_interested: str('services_interested'),
            biggest_challenge: str('biggest_challenge'),
            message: str('message'),
          }).join(', '),
      logo_v: str('logo_v'),
    },
    overrides: parseOverrides(row.deck),
  };
}

function fail(error: unknown, what: string) {
  if (error instanceof Error && error.message === 'Unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.error(`Deck ${what} error:`, error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!ID_RE.test(id)) return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    const data = await load(id);
    if (!data) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    return fail(error, 'fetch');
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!ID_RE.test(id)) return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });

    const body = await request.json().catch(() => null);
    const json = serializeOverrides(cleanOverrides(body?.overrides));
    if (json === null) return NextResponse.json({ error: 'That deck is too big to save' }, { status: 400 });

    const db = getAdminDb();
    await initializeTables(db);
    const result = await db.execute({
      sql: 'UPDATE contacts SET deck = ? WHERE id = ? RETURNING id',
      args: [json, id],
    });
    if (result.rows.length === 0) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return fail(error, 'save');
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!ID_RE.test(id)) return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    const db = getAdminDb();
    await initializeTables(db);
    await db.execute({
      sql: "UPDATE contacts SET deck = '' WHERE id = ?",
      args: [id],
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return fail(error, 'reset');
  }
}
