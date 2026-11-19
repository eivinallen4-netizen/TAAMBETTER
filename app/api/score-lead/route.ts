import { after, type NextRequest } from 'next/server';
import { saveWebsiteLead } from '@/lib/crm-site/leads';
import { createRateLimiter, handleRateLimit } from '@/lib/ratelimit';
import { getClientIp, logger } from '@/lib/logger';
import { renderBrandEmail, sendBrandEmail } from '@/lib/brand-email';
import { SITE_URL } from '@/lib/site-url';
import { smsConsentRecord } from '@/app/lib/legal';
import {
  CRM_INDUSTRY,
  CRM_ROLE,
  CRM_SERVICE,
  CRM_TIMELINE,
  QUIZ,
  answerDetails,
  callBrief,
  cleanAnswers,
  computeResult,
  isComplete,
  planText,
  type QuizResult,
} from '@/lib/score-quiz';
import { SCORE_SOURCE, scoreAlertRecipients, scoreAlertsOn, scorePlanEmailOn } from '@/app/lib/score-config';

// The Call Flow Score (/score) sends every finished quiz into the CRM as a lead, through the same
// saveWebsiteLead path as the contact form and the free tools (one lead per email; a second save
// fills blanks and merges the message).
//   step "email":    partial lead (name, email, answers) so drop-offs aren't lost.
//   step "complete": the same lead with business, phone, consent and the call brief.
// The score and route are recomputed here from the raw answers; nothing the page computed is trusted.
// Hot-lead alerts (SCORE_ALERT_EMAIL) and the plan email (SCORE_PLAN_EMAIL=on) are off until set.

export const maxDuration = 30;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Two posts per real visitor (email step, phone step), with room for retakes and retries.
const scoreLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, maxRequests: 12 });

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request.headers);
  const limit = scoreLimiter(request, `score-lead:${clientIp}`);
  if (!limit.allowed) return handleRateLimit(limit.resetTime!);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Honeypot: real visitors never see or fill this field. Answer like it worked, save nothing.
  if (str(body.company_fax, 100)) return Response.json({ success: true });

  const step = body.step === 'complete' ? 'complete' : 'email';
  const firstName = str(body.first_name, 80);
  const lastName = str(body.last_name, 80);
  const email = str(body.email, 200);
  const business = str(body.business_name, 160);
  const phoneDigits = str(body.phone, 40).replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  const answers = cleanAnswers(body.answers);

  if (!firstName || !EMAIL_RE.test(email)) {
    return Response.json({ error: 'A first name and a valid email are required' }, { status: 400 });
  }
  if (!isComplete(answers)) {
    return Response.json({ error: 'The quiz is not finished' }, { status: 400 });
  }
  if (step === 'complete' && (business.length < 2 || phoneDigits.length !== 10)) {
    return Response.json({ error: 'A business name and a 10-digit phone number are required' }, { status: 400 });
  }

  const utmIn = (body.utm && typeof body.utm === 'object' ? body.utm : {}) as Record<string, unknown>;
  const utm = new URLSearchParams();
  for (const key of UTM_KEYS) {
    const v = str(utmIn[key], 120);
    if (v) utm.set(key, v);
  }
  const tradeParam = str(utmIn.trade, 40);
  if (tradeParam) utm.set('trade', tradeParam);
  const fbclid = str(utmIn.fbclid, 300);
  const sourcePage = `/score${utm.size ? `?${utm.toString()}` : ''}`.slice(0, 300);

  const r = computeResult(answers);
  const person = { firstName, lastName, business };
  const details = answerDetails(answers, r);
  const tracking = fbclid ? `\nfbclid: ${fbclid}` : '';
  // The partial message is a piece of the full one, so the CRM's merge swaps it for the full one.
  const message = step === 'complete' ? `${callBrief(person, answers, r)}\n\n${details}${tracking}` : `${details}${tracking}`;

  let leadId = '';
  try {
    const saved = await saveWebsiteLead(
      {
        first_name: firstName,
        last_name: lastName,
        email,
        ...(step === 'complete' && {
          business_name: business,
          phone: formatPhone(phoneDigits),
          // Only an explicit tick of the optional, unchecked box counts.
          ...(body.sms_consent === true && { sms_consent: smsConsentRecord("/score") }),
        }),
        industry: CRM_INDUSTRY,
        role: CRM_ROLE[answers.role] ?? '',
        timeline: CRM_TIMELINE[answers.timing] ?? '',
        biggest_challenge: r.weakest.label.slice(0, 80),
        services_interested: [CRM_SERVICE[r.weakest.id]],
        source_page: sourcePage,
        message,
      },
      SCORE_SOURCE
    );
    leadId = saved.id;
  } catch (err) {
    // Never hold the visitor's results hostage to a database hiccup.
    logger.error('Score lead write failed', { error: err instanceof Error ? err.message : String(err), step });
  }

  if (step === 'complete') {
    const lead = { leadId, email, person, phoneDigits, answers, r };
    after(async () => {
      if (r.route === 'hot' && scoreAlertsOn()) await sendHotAlert(lead).catch((e) => logger.error('Hot lead alert failed', { error: String(e) }));
      if (scorePlanEmailOn()) await sendPlanEmail(lead).catch((e) => logger.error('Score plan email failed', { error: String(e) }));
    });
  }

  return Response.json({ success: true, score: r.score, route: r.route });
}

function formatPhone(d: string): string {
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

interface FinishedLead {
  leadId: string;
  email: string;
  person: { firstName: string; lastName: string; business: string };
  phoneDigits: string;
  answers: Record<string, string>;
  r: QuizResult;
}

/** Speed to lead: the team gets the call brief the moment a hot lead finishes. */
async function sendHotAlert(lead: FinishedLead) {
  const recipients = scoreAlertRecipients();
  const { person, r } = lead;
  const name = `${person.firstName} ${person.lastName}`.trim();
  const phone = formatPhone(lead.phoneDigits);
  const { html, text } = renderBrandEmail({
    preheader: `${name} at ${person.business}. Call ${phone} now.`,
    eyebrow: 'Hot lead · Call Flow Score',
    title: `Call ${person.firstName} now`,
    body: `${callBrief(person, lead.answers, r)}\n\nThe results page told them someone will call shortly. Aim to call within 5 minutes.`,
    mascot: 'phone',
    cta: lead.leadId ? { label: 'Open the lead', url: `${SITE_URL}/admin/leads/${lead.leadId}` } : undefined,
    details: [
      ['Phone', phone],
      ['Email', lead.email],
      ['Score', `${r.score}/100 (${r.tier.label})`],
      ['#1 gap', r.weakest.label],
    ],
    footer: 'Sent because a hot lead finished the Call Flow Score on taammarketing.com/score.',
  });
  for (const addr of recipients) {
    await sendBrandEmail({ to: addr, subject: `Hot lead: ${name}, ${person.business} (${r.score}/100)`, html, text, tag: 'score-hot-lead' });
  }
}

/** The lead's own copy of their plan. */
async function sendPlanEmail(lead: FinishedLead) {
  const { person, r } = lead;
  const book = r.route === 'hot' || r.route === 'qualified';
  const { html, text } = renderBrandEmail({
    preheader: `Your #1 gap is ${r.weakest.label.toLowerCase()}. Here's your 90-day plan.`,
    eyebrow: 'Your Call Flow Score',
    title: `${r.score}/100. ${r.tier.label}.`,
    body: planText(person, lead.answers, r),
    mascot: 'counting',
    cta: book ? { label: QUIZ.config.bookingLabel, url: QUIZ.config.bookingUrl } : undefined,
    footer: 'You got this email because you took the Call Flow Score at taammarketing.com/score.',
  });
  await sendBrandEmail({ to: lead.email, subject: `${person.firstName}, your Call Flow Score: ${r.score}/100`, html, text, tag: 'score-plan' });
}
