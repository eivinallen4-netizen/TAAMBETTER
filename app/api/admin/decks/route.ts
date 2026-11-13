import { NextResponse } from 'next/server';
import { requireOwner } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { listDeckLeads } from '@/lib/crm-site/decks';

// The leads behind the "Client slides" list. Owner only, like the leads themselves.

export async function GET() {
  try {
    await requireOwner();
    return NextResponse.json({ leads: await listDeckLeads(getAdminDb()) });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Only the owner can see client slides.' }, { status: 401 });
    }
    console.error('Deck list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
