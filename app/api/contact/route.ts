import { randomUUID } from 'crypto';
import type { NextRequest } from 'next/server';
import { createClient } from '@libsql/client';
import { initializeTables } from '@/lib/init-tables';
import { saveContact } from '@/lib/contacts';
import { getClientIp, logger } from '@/lib/logger';
import { createRateLimiter, handleRateLimit } from '@/lib/ratelimit';
import {
  BUDGET_OPTIONS,
  INDUSTRY_OPTIONS,
  MIN_HUMAN_FILL_MS,
  ROLE_OPTIONS,
  STAGE_OPTIONS,
  TIMELINE_OPTIONS,
  isDisposableEmail,
  isPlausiblePhone,
  scoreLeadFit,
  type LeadFit,
  type QualifierOption,
} from '@/app/lib/cta';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// A real lead posts twice (partial on email blur, then complete), so this leaves room for retries.
const contactLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, maxRequests: 10 });

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  completion_status: 'partial' | 'complete';
  timestamp: string;
  source_page: string;
  biggest_challenge?: string;
  services_interested?: string | string[];
  business_name?: string;
  industry: string;
  business_stage: string;
  budget: string;
  timeline: string;
  website: string;
  role: string;
  lead_fit: LeadFit;
}

function pickOption(options: QualifierOption[], value: unknown): string {
  return typeof value === 'string' && options.some((o) => o.value === value) ? value : '';
}

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

async function writeToTurso(contact: Contact): Promise<{ success: boolean; error?: string }> {
  try {
    const servicesStr = Array.isArray(contact.services_interested)
      ? contact.services_interested.join(', ')
      : (contact.services_interested || '');

    await saveContact(getDb(), {
      ...contact,
      biggest_challenge: contact.biggest_challenge || '',
      services_interested: servicesStr,
      business_name: contact.business_name || '',
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown Turso error' };
  }
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const limit = contactLimiter(request, `contact:${clientIp}`);
  if (!limit.allowed) return handleRateLimit(limit.resetTime!);

  await initializeTables(getDb()).catch((err) => console.error('Table init failed:', err));

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Bots: a hidden field humans never see got filled, or four steps were "completed" in a blink.
  // Answer like it worked so they don't learn to dodge it, but save nothing.
  const honeypot = typeof body.company_fax === 'string' ? body.company_fax.trim() : '';
  const elapsedMs = typeof body.elapsed_ms === 'number' ? body.elapsed_ms : null;
  const isFinalSubmit = body.final === true;
  if (honeypot || (isFinalSubmit && elapsedMs !== null && elapsedMs < MIN_HUMAN_FILL_MS)) {
    logger.warn('Contact form bot submission dropped', { clientIp, honeypot: Boolean(honeypot), elapsedMs });
    return Response.json({ success: true, completion_status: 'complete', lead_fit: 'possible' });
  }

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const businessName = typeof body.business_name === 'string' ? body.business_name.trim() : '';
  const biggestChallenge = typeof body.biggest_challenge === 'string' ? body.biggest_challenge : '';
  const servicesInterested = Array.isArray(body.services_interested)
    ? body.services_interested.filter((s): s is string => typeof s === 'string')
    : [];
  const sourcePage = typeof body.source_page === 'string' ? body.source_page : '';
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';
  const website = typeof body.website === 'string' ? body.website.trim().slice(0, 300) : '';
  const industry = pickOption(INDUSTRY_OPTIONS, body.industry);
  const businessStage = pickOption(STAGE_OPTIONS, body.business_stage);
  const budget = pickOption(BUDGET_OPTIONS, body.budget);
  const timeline = pickOption(TIMELINE_OPTIONS, body.timeline);
  const role = pickOption(ROLE_OPTIONS, body.role);

  if (email && isDisposableEmail(email)) {
    return Response.json({ error: 'Please use a real email address' }, { status: 400 });
  }

  // Trigger capture on name OR email (partial submission)
  const hasMinimalInfo = name.trim() !== '' || (email.trim() !== '' && EMAIL_RE.test(email));
  if (!hasMinimalInfo) {
    return Response.json({ error: 'At least name or valid email required' }, { status: 400 });
  }

  // Determine completion status
  const isComplete =
    name.trim() !== '' &&
    email.trim() !== '' &&
    EMAIL_RE.test(email) &&
    isPlausiblePhone(phone) &&
    businessName !== '' &&
    biggestChallenge !== '' &&
    budget !== '' &&
    timeline !== '';

  const contact: Contact = {
    id: randomUUID(),
    name,
    email,
    phone,
    message,
    completion_status: isComplete ? 'complete' : 'partial',
    timestamp: new Date().toISOString(),
    source_page: sourcePage,
    ...(biggestChallenge && { biggest_challenge: biggestChallenge }),
    ...(servicesInterested.length > 0 && { services_interested: servicesInterested }),
    ...(businessName && { business_name: businessName }),
    industry,
    business_stage: businessStage,
    budget,
    timeline,
    website,
    role,
    lead_fit: scoreLeadFit({ stage: businessStage, budget, timeline, role }),
  };

  // Write to Turso - don't block on failure
  const tursoResult = await writeToTurso(contact);
  if (!tursoResult.success) {
    console.error('Turso write failed:', tursoResult.error);
  }

  return Response.json({ success: true, completion_status: contact.completion_status, lead_fit: contact.lead_fit });
}
