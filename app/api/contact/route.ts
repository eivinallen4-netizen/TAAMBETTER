import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const LEADS_FILE = join(process.cwd(), 'app', 'content', 'leads.json');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CrmStatus = 'sent' | 'failed' | 'not_configured';

interface Lead {
  id: string;
  biggest_challenge: string;
  services_interested: string[];
  name: string;
  email: string;
  phone: string;
  business_name: string;
  source_page: string;
  timestamp: string;
  crmStatus: CrmStatus;
  crmError?: string;
}

async function readLeads(): Promise<Lead[]> {
  try {
    const data = await readFile(LEADS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeLeads(leads: Lead[]) {
  await writeFile(LEADS_FILE, JSON.stringify(leads, null, 2));
}

async function pushToZoho(lead: Lead): Promise<{ status: CrmStatus; error?: string }> {
  const { ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN } = process.env;
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN) {
    return { status: 'not_configured' };
  }

  const accountsDomain = process.env.ZOHO_ACCOUNTS_DOMAIN || 'https://accounts.zoho.com';
  const apiDomain = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com';
  const leadsModule = process.env.ZOHO_LEADS_MODULE || 'Leads';

  try {
    const tokenRes = await fetch(`${accountsDomain}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        refresh_token: ZOHO_REFRESH_TOKEN,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return { status: 'failed', error: tokenData.error || 'Failed to obtain Zoho access token' };
    }

    const nameParts = lead.name.trim().split(/\s+/);
    const firstName = nameParts.length > 1 ? nameParts[0] : '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];

    const description = [
      `Biggest challenge: ${lead.biggest_challenge}`,
      `Services interested: ${lead.services_interested.join(', ')}`,
      `Source page: ${lead.source_page || 'unknown'}`,
      `Submitted: ${lead.timestamp}`,
    ].join('\n');

    const crmRes = await fetch(`${apiDomain}/crm/v8/${leadsModule}`, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [
          {
            Last_Name: lastName || 'Website Lead',
            ...(firstName ? { First_Name: firstName } : {}),
            Email: lead.email,
            Phone: lead.phone,
            Company: lead.business_name || 'Unknown',
            Lead_Source: 'Website',
            Description: description,
          },
        ],
      }),
    });
    const crmData = await crmRes.json();
    const record = crmData?.data?.[0];
    if (!crmRes.ok || record?.status !== 'success') {
      return { status: 'failed', error: record?.message || 'Zoho CRM rejected the record' };
    }
    return { status: 'sent' };
  } catch (err) {
    return { status: 'failed', error: err instanceof Error ? err.message : 'Unknown error contacting Zoho' };
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
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

  if (!name || !email || !phone || !biggestChallenge || servicesInterested.length === 0) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: 'Invalid email' }, { status: 400 });
  }
  if (phone.replace(/\D/g, '').length < 10) {
    return Response.json({ error: 'Invalid phone' }, { status: 400 });
  }

  const lead: Lead = {
    id: randomUUID(),
    biggest_challenge: biggestChallenge,
    services_interested: servicesInterested,
    name,
    email,
    phone,
    business_name: businessName,
    source_page: sourcePage,
    timestamp: new Date().toISOString(),
    crmStatus: 'not_configured',
  };

  const zohoResult = await pushToZoho(lead);
  lead.crmStatus = zohoResult.status;
  if (zohoResult.error) {
    lead.crmError = zohoResult.error;
    console.error('Zoho CRM push failed:', zohoResult.error);
  }

  try {
    const leads = await readLeads();
    leads.push(lead);
    await writeLeads(leads);
  } catch (err) {
    console.error('Failed to persist lead to leads.json', err);
  }

  return Response.json({ success: true });
}
