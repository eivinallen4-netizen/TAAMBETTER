import { after, NextRequest } from 'next/server';
import { createClient } from '@libsql/client';
import { initializeTables } from '@/lib/init-tables';
import { saveContact } from '@/lib/contacts';
import { createRateLimiter, handleRateLimit } from '@/lib/ratelimit';
import { getClientIp } from '@/lib/logger';
import { FREE_TOOLS, type FreeTool } from '@/app/lib/tools';
import { resolveToolReport } from '@/lib/tool-report-input';
import { sendToolEmail } from '@/lib/tool-email';
import { syncToolLeadToHubSpot } from '@/lib/hubspot';

// Email gate for the free tools. Leads land in the same contacts table as the main form, tagged
// with the tool's page as source_page, so they show up in /admin/contacts with the result attached.
// When the visitor asks for it (`deliver`), the full report is emailed to them and the lead is pushed
// to HubSpot, after the response so the page never waits on either.

export const maxDuration = 30;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toolLeadLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, maxRequests: 15 });

// A few emailed reports per address per tool per hour, however many times the page asks.
const deliveryLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, maxRequests: 3 });

let db: ReturnType<typeof createClient> | null = null;

function getDb() {
  if (!db) {
    if (!process.env.TURSO_URL || !process.env.TURSO_TOKEN) {
      throw new Error('Turso not configured');
    }
    db = createClient({ url: process.env.TURSO_URL, authToken: process.env.TURSO_TOKEN });
  }
  return db;
}

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  const limit = toolLeadLimiter(request, `tool-lead:${getClientIp(request.headers)}`);
  if (!limit.allowed) return handleRateLimit(limit.resetTime!);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Honeypot: real visitors never see or fill this field.
  if (str(body.company_fax, 100)) {
    return Response.json({ success: true });
  }

  const tool = FREE_TOOLS.find((t) => t.slug === body.tool);
  const email = str(body.email, 200);
  if (!tool || !EMAIL_RE.test(email)) {
    return Response.json({ error: 'A valid email is required' }, { status: 400 });
  }

  const name = str(body.name, 120);
  const website = str(body.website, 300);
  const summary = str(body.summary, 1800);

  try {
    const database = getDb();
    await initializeTables(database);
    await saveContact(database, {
      name,
      email,
      message: `[Free tool: ${tool.name}] ${summary}`,
      completion_status: 'partial',
      timestamp: new Date().toISOString(),
      source_page: `/tools/${tool.slug}`,
      biggest_challenge: tool.challenge,
      services_interested: tool.services.join(', '),
      website,
    });
  } catch (err) {
    // Never hold the visitor's report hostage to a database hiccup.
    console.error('Tool lead write failed:', err);
  }

  const deliver = body.deliver === true && deliveryLimiter(request, `tool-email:${tool.slug}:${email.toLowerCase()}`).allowed;
  if (deliver) {
    after(() => deliverReport({ tool, email, name, website, summary, payload: body.report, pdf: body.pdf === true }));
  }

  return Response.json({ success: true, emailed: deliver });
}

async function deliverReport(lead: { tool: FreeTool; email: string; name: string; website: string; summary: string; payload: unknown; pdf: boolean }) {
  const { tool, email, name } = lead;
  let report = null;
  try {
    report = await resolveToolReport(tool.slug, lead.payload);
  } catch (err) {
    console.error(`Tool report rebuild failed (${tool.slug}):`, err);
  }

  let emailed = false;
  if (report) {
    try {
      emailed = await sendToolEmail(email, report, name.split(' ')[0], lead.pdf);
    } catch (err) {
      console.error('Tool report email failed:', err);
    }
  }

  try {
    await syncToolLeadToHubSpot({
      email,
      firstName: name,
      website: report?.website ?? lead.website,
      toolName: tool.name,
      toolUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://taammarketing.com'}/tools/${tool.slug}`,
      summary: report?.summary ?? lead.summary,
      emailed,
    });
  } catch (err) {
    console.error('HubSpot sync failed:', err);
  }
}
