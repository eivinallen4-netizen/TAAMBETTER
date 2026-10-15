import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { newOnboardingToken, onboardingUrl, toOnboardingRow } from '@/lib/onboarding-store';
import { emptyAnswers, stepsFor } from '@/app/lib/onboarding';

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function errorResponse(error: unknown, label: string) {
  console.error(`${label}:`, error);
  if (error instanceof Error && error.message === 'Unauthorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const db = getAdminDb();
    await initializeTables(db);

    const result = await db.execute(
      `SELECT id, token, kind, client_name, business_name, client_email, message, status, current_step, answers,
              admin_notes, created_at, updated_at, opened_at, submitted_at
       FROM client_onboardings ORDER BY created_at DESC`
    );

    const origin = request.nextUrl.origin;
    const data = result.rows.map((r) => {
      const row = toOnboardingRow(r as Record<string, unknown>);
      return {
        id: row.id,
        kind: row.kind,
        step_count: stepsFor(row.kind).length,
        client_name: row.client_name,
        business_name: row.business_name,
        client_email: row.client_email,
        status: row.status,
        current_step: row.current_step,
        social_count: row.answers.social.length,
        website: row.answers.website.currentUrl,
        created_at: row.created_at,
        updated_at: row.updated_at,
        submitted_at: row.submitted_at,
        url: onboardingUrl(row.token, origin),
      };
    });

    return NextResponse.json({ data, total: data.length });
  } catch (error) {
    return errorResponse(error, 'Onboarding list error');
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const kind = body.kind;
    if (kind !== 'website' && kind !== 'social') {
      return NextResponse.json({ error: 'Pick website or social media' }, { status: 400 });
    }
    const clientName = str(body.clientName, 120);
    if (!clientName) {
      return NextResponse.json({ error: "Client's name is required" }, { status: 400 });
    }
    const businessName = str(body.businessName, 160);
    const email = str(body.email, 200);
    const message = str(body.message, 1500);

    const db = getAdminDb();
    await initializeTables(db);

    const id = randomUUID();
    const token = newOnboardingToken();
    const now = new Date().toISOString();
    const answers = emptyAnswers({ businessName, contactName: clientName, email });

    await db.execute({
      sql: `INSERT INTO client_onboardings
              (id, token, kind, client_name, business_name, client_email, message, status, current_step, answers, credentials, admin_notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', 0, ?, NULL, '', ?, ?)`,
      args: [id, token, kind, clientName, businessName, email, message, JSON.stringify(answers), now, now],
    });

    return NextResponse.json({ id, kind, url: onboardingUrl(token, request.nextUrl.origin) }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 'Onboarding create error');
  }
}
