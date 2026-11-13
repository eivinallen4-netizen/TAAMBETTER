import { NextRequest, NextResponse } from 'next/server';
import { requireOwner } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { cleanLogo } from '@/lib/contact-logo';
import { saveLogo } from '@/lib/crm-site/decks';

// The company logo shown on a lead's slides: PATCH { logo } saves it ('' clears it) and
// answers with the new logo version. Everything else about a lead is the CRM's (/admin/leads).

const ID_RE = /^[a-f0-9\-]{36}$/i;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireOwner();
    const { id } = await params;
    if (!ID_RE.test(id)) return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });

    const body = await request.json().catch(() => null);
    if (!body || !('logo' in body)) return NextResponse.json({ error: 'Send a logo to save' }, { status: 400 });
    const logo = cleanLogo(body.logo);
    if (logo === null) return NextResponse.json({ error: 'That logo is too big or not a PNG, JPEG or WebP image' }, { status: 400 });

    const version = await saveLogo(getAdminDb(), id, logo);
    if (version === null) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    return NextResponse.json({ success: true, logo_v: version });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Contact logo save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
