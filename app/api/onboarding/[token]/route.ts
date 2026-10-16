import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { createRateLimiter, handleRateLimit } from '@/lib/ratelimit';
import { getClientIp } from '@/lib/logger';
import { addSecurityHeaders } from '@/lib/security-headers';
import { decryptPasswords, encryptPasswords, getOnboardingByToken } from '@/lib/onboarding-store';
import { normalizeAnswers, stepsFor, WEBSITE_PASSWORD_KEY, type PasswordMap } from '@/app/lib/onboarding';
import { sendBrandEmail } from '@/lib/brand-email';
import { renderOnboardingReceivedEmail } from '@/lib/crm-email';

// Public endpoint behind the per-client link. The token is the only credential, so passwords
// are never sent back out: the form only learns which logins already have one saved.

const onboardingLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 120 });

const MAX_BODY_CHARS = 200_000;

function json(body: unknown, status = 200) {
  return addSecurityHeaders(NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } }));
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const limit = onboardingLimiter(request, `onboarding:${getClientIp(request.headers)}`);
  if (!limit.allowed) return handleRateLimit(limit.resetTime!);

  const { token } = await params;
  try {
    const db = getAdminDb();
    await initializeTables(db);
    const row = await getOnboardingByToken(db, token);
    if (!row) return json({ error: 'Not found' }, 404);

    if (!row.opened_at) {
      const now = new Date().toISOString();
      await db.execute({
        sql: `UPDATE client_onboardings SET opened_at = ?, status = CASE WHEN status = 'sent' THEN 'opened' ELSE status END WHERE id = ?`,
        args: [now, row.id],
      });
    }

    const submitted = row.status === 'submitted' || row.status === 'complete';
    const saved = submitted ? [] : Object.keys(decryptPasswords(row.credentials)).filter(Boolean);

    return json({
      kind: row.kind,
      clientName: row.client_name,
      businessName: row.business_name,
      message: row.message,
      submitted,
      step: row.current_step,
      answers: submitted ? null : row.answers,
      savedPasswords: saved,
    });
  } catch (error) {
    console.error('Onboarding fetch error:', error);
    return json({ error: 'Something went wrong' }, 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const limit = onboardingLimiter(request, `onboarding:${getClientIp(request.headers)}`);
  if (!limit.allowed) return handleRateLimit(limit.resetTime!);

  const { token } = await params;

  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) return json({ error: 'That is too much to save at once' }, 413);

  let body: { answers?: unknown; passwords?: unknown; step?: unknown; submit?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  try {
    const db = getAdminDb();
    await initializeTables(db);
    const row = await getOnboardingByToken(db, token);
    if (!row) return json({ error: 'Not found' }, 404);
    if (row.status === 'submitted' || row.status === 'complete') {
      return json({ error: 'This onboarding was already submitted' }, 409);
    }

    const answers = normalizeAnswers(body.answers);

    // Blank password fields mean "keep what's saved"; logins that were removed lose theirs.
    const keep = new Set([WEBSITE_PASSWORD_KEY, ...answers.social.map((s) => s.id)]);
    const merged: PasswordMap = {};
    for (const [key, value] of Object.entries(decryptPasswords(row.credentials))) {
      if (keep.has(key)) merged[key] = value;
    }
    if (body.passwords && typeof body.passwords === 'object') {
      for (const [key, value] of Object.entries(body.passwords as Record<string, unknown>)) {
        if (keep.has(key) && typeof value === 'string' && value.length > 0) merged[key] = value.slice(0, 500);
      }
    }

    const step = Math.max(0, Math.min(stepsFor(row.kind).length - 1, Number(body.step) || 0));
    const submit = body.submit === true;
    const now = new Date().toISOString();

    await db.execute({
      sql: `UPDATE client_onboardings
            SET answers = ?, credentials = ?, current_step = ?, status = ?, updated_at = ?, submitted_at = ?
            WHERE id = ?`,
      args: [
        JSON.stringify(answers),
        encryptPasswords(merged),
        step,
        submit ? 'submitted' : 'in_progress',
        now,
        submit ? now : row.submitted_at,
        row.id,
      ],
    });

    // Branded "got it" email to the client. A failed send never fails their submission.
    const to = answers.business.email || row.client_email;
    if (submit && to) {
      try {
        const firstName = (answers.business.contactName || row.client_name).trim().split(/\s+/)[0] ?? '';
        const mail = renderOnboardingReceivedEmail(firstName, answers.business.businessName || row.business_name, row.kind === 'website');
        await sendBrandEmail({ to, ...mail, tag: 'onboarding_received' });
      } catch (err) {
        console.error('Onboarding received email failed:', err);
      }
    }

    return json({ success: true, savedPasswords: Object.keys(merged), submitted: submit });
  } catch (error) {
    console.error('Onboarding save error:', error);
    return json({ error: 'Could not save. Please try again.' }, 500);
  }
}
