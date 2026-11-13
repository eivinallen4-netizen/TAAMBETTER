import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { cleanOverrides, serializeOverrides } from '@/lib/deck';
import { loadDeck, saveDeck } from '@/lib/crm-site/decks';

// A lead's marketing-plan slides: GET returns what the slides page needs (the lead, its logo
// version and the saved edits), PUT saves the edits, DELETE resets the deck to the defaults.
// Owner only, like the leads themselves.

const ID_RE = /^[a-f0-9\-]{36}$/i;

function fail(error: unknown, what: string) {
  if (error instanceof Error && error.message === 'Unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.error(`Deck ${what} error:`, error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOwner();
    const { id } = await params;
    if (!ID_RE.test(id)) return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    const data = await loadDeck(getAdminDb(), id);
    if (!data) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    return fail(error, 'fetch');
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOwner();
    const { id } = await params;
    if (!ID_RE.test(id)) return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });

    const body = await request.json().catch(() => null);
    const json = serializeOverrides(cleanOverrides(body?.overrides));
    if (json === null) return NextResponse.json({ error: 'That deck is too big to save' }, { status: 400 });

    if (!(await saveDeck(getAdminDb(), id, json))) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return fail(error, 'save');
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOwner();
    const { id } = await params;
    if (!ID_RE.test(id)) return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    await saveDeck(getAdminDb(), id, '');
    return NextResponse.json({ success: true });
  } catch (error) {
    return fail(error, 'reset');
  }
}
