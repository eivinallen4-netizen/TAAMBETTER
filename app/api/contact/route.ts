import { randomUUID } from 'crypto';
import type { NextRequest } from 'next/server';
import { bookingLinkFor, saveWebsiteLead } from '@/lib/crm-site/leads';
import { discoveryCallUrl } from '@/lib/calendly';
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
import { smsConsentRecord } from '@/app/lib/legal';

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
  sms_consent: string;
}

function pickOption(options: QualifierOption[], value: unknown): string {
  return typeof value === 'string' && options.some((o) => o.value === value) ? value : '';
}

/** Saves the lead in the CRM (/admin/leads). Returns the lead's id. */
async function writeToTurso(contact: Contact): Promise<{ success: boolean; contactId?: string; error?: string }> {
  try {
    const { id: contactId } = await saveWebsiteLead({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      message: contact.message,
      business_name: contact.business_name,
      website: contact.website,
      industry: contact.industry,
      business_stage: contact.business_stage,
      budget: contact.budget,
      timeline: contact.timeline,
      role: contact.role,
      biggest_challenge: contact.biggest_challenge,
      services_interested: contact.services_interested,
      source_page: contact.source_page,
      sms_consent: contact.sms_consent,
    });

    return { success: true, contactId };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown Turso error' };
  }
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const limit = contactLimiter(request, `contact:${clientIp}`);
  if (!limit.allowed) return handleRateLimit(limit.resetTime!);

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
  // Only an explicit tick of the optional, unchecked box counts, and only with a real number.
  const smsConsent = body.sms_consent === true && isPlausiblePhone(phone) ? smsConsentRecord(sourcePage) : '';

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
    sms_consent: smsConsent,
  };

  // Write to Turso - don't block on failure
  const tursoResult = await writeToTurso(contact);
  if (!tursoResult.success) {
    console.error('Turso write failed:', tursoResult.error);
  }

  // Speed to lead: a qualified lead books the call right on the confirmation screen. The booking runs
  // through an appointment link like the setters' ones, so it lands on this contact in the CRM.
  let booking: { token: string; eventUrl: string } | null = null;
  const qualified = contact.lead_fit === 'strong' || contact.lead_fit === 'possible';
  const eventUrl = discoveryCallUrl();
  if (isFinalSubmit && isComplete && qualified && eventUrl && tursoResult.contactId) {
    try {
      const token = await bookingLinkFor({ id: tursoResult.contactId, name, businessName });
      booking = { token, eventUrl };
    } catch (err) {
      console.error('Booking link failed, falling back to a callback:', err);
    }
  }

  return Response.json({ success: true, completion_status: contact.completion_status, lead_fit: contact.lead_fit, booking });
}
