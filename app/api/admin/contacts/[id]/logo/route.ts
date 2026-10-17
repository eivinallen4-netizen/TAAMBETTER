import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';

// Serves a contact's uploaded company logo as an image, so lists don't have to carry every logo inline.

const DATA_URL_RE = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!id.match(/^[a-f0-9\-]{36}$/i)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const db = getAdminDb();
    await initializeTables(db);
    const result = await db.execute({ sql: 'SELECT logo FROM contacts WHERE id = ?', args: [id] });
    const match = DATA_URL_RE.exec(String(result.rows[0]?.logo ?? ''));
    if (!match) return new NextResponse(null, { status: 404 });

    return new NextResponse(Buffer.from(match[2], 'base64'), {
      headers: {
        'Content-Type': match[1],
        // The URL carries a version, so a new upload is a new URL.
        'Cache-Control': 'private, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Contact logo error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
