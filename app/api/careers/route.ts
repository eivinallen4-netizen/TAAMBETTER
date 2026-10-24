import { randomUUID } from 'crypto';
import type { NextRequest } from 'next/server';
import { createClient } from '@libsql/client';
import { getClientIp, logger } from '@/lib/logger';
import { createRateLimiter, handleRateLimit } from '@/lib/ratelimit';
import { REPLY_TO, renderBrandEmail, sendBrandEmail } from '@/lib/brand-email';
import { EXPERIENCE_OPTIONS, getRole } from '@/app/lib/careers';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_HUMAN_FILL_MS = 6000;

const applyLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, maxRequests: 5 });

let db: ReturnType<typeof createClient> | null = null;

function getDb() {
  if (!db) {
    const TURSO_URL = process.env.TURSO_URL;
    const TURSO_TOKEN = process.env.TURSO_TOKEN;

    if (!TURSO_URL || !TURSO_TOKEN) {
      throw new Error('Turso not configured');
    }

    db = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    });
  }
  return db;
}

async function initializeTable(): Promise<void> {
  await getDb().execute(`
    CREATE TABLE IF NOT EXISTS job_applications (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      experience TEXT NOT NULL,
      link TEXT NOT NULL,
      proof TEXT NOT NULL,
      why TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const limit = applyLimiter(request, `careers:${clientIp}`);
  if (!limit.allowed) return handleRateLimit(limit.resetTime!);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Bots: the hidden field got filled, or the whole form was "written" in a blink. Answer like it worked.
  const elapsedMs = typeof body.elapsed_ms === 'number' ? body.elapsed_ms : null;
  if (str(body.company_fax, 200) || (elapsedMs !== null && elapsedMs < MIN_HUMAN_FILL_MS)) {
    logger.warn('Career application bot submission dropped', { clientIp, elapsedMs });
    return Response.json({ success: true });
  }

  const role = getRole(str(body.role, 60));
  const name = str(body.name, 120);
  const email = str(body.email, 200);
  const phone = str(body.phone, 40);
  const experience = EXPERIENCE_OPTIONS.some((o) => o.value === body.experience) ? (body.experience as string) : '';
  const link = str(body.link, 500);
  const proof = str(body.proof, 4000);
  const why = str(body.why, 4000);

  if (!role || !name || !EMAIL_RE.test(email) || phone.replace(/\D/g, '').length < 10 || !experience || !link || !proof) {
    return Response.json({ error: 'Please fill in every required field.' }, { status: 400 });
  }

  const id = randomUUID();
  try {
    await initializeTable();
    await getDb().execute({
      sql: `INSERT INTO job_applications (id, role, name, email, phone, experience, link, proof, why, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, role.slug, name, email, phone, experience, link, proof, why, new Date().toISOString()],
    });
  } catch (err) {
    console.error('Career application save failed:', err);
    return Response.json({ error: 'Failed to save application' }, { status: 500 });
  }

  // Let the team know. The application is already saved, so a failed email doesn't fail the submit.
  try {
    const { html, text } = renderBrandEmail({
      preheader: `${name} applied for ${role.title}`,
      eyebrow: 'New application',
      title: `${role.title} applicant`,
      body: `${name} applied for the senior ${role.title.toLowerCase()} role.\n\n${proof}${why ? `\n\nWhy TAAM: ${why}` : ''}`,
      mascot: 'wave',
      details: [
        ['Experience', experience + ' years'],
        ['Email', email],
        ['Phone', phone],
        ['Link', link],
      ],
      footer: 'Sent from the careers page on taammarketing.com.',
    });
    await sendBrandEmail({ to: REPLY_TO, subject: `Application: ${role.title} — ${name}`, html, text, tag: 'career_application' });
  } catch (err) {
    console.error('Career application email failed:', err);
  }

  return Response.json({ success: true, id });
}
