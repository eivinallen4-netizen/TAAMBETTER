import { saveLead, type SaveLeadInput } from '@taam/crm/server';
import { crm } from '@/crm';

// The website's own forms (the contact form, the free tools) put their leads in the CRM here.
// One lead per email address: a second submission merges into the first (blanks are filled, the
// message is appended), the same way the forms always worked.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Saves a lead from a website form. Blank fields are left out; an email that is not valid yet (a half-typed one) is not sent. */
export async function saveWebsiteLead(fields: Omit<SaveLeadInput, 'source'>): Promise<{ id: string; created: boolean; leadFit: string }> {
  const input: Record<string, unknown> = { source: 'Website' };
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    input[key] = value;
  }
  if (typeof input.email === 'string' && !EMAIL_RE.test(input.email.trim())) delete input.email;
  const saved = await saveLead(await crm.context(), input as SaveLeadInput);
  return { id: saved.client_id, created: saved.created, leadFit: saved.lead_fit };
}

/**
 * A private booking link for a lead who just qualified on the website form, so the call they
 * book lands on their record. Returns the link's token (it rides along to Calendly).
 */
export async function bookingLinkFor(lead: { id: string; name: string; businessName: string }): Promise<string> {
  const made = (await crm.call('create_appointment_link', {
    client_id: lead.id,
    client_name: lead.name,
    business_name: lead.businessName,
  })) as { appointment_link: { url: string } };
  const token = made.appointment_link.url.split('/').pop() ?? '';
  if (!token) throw new Error('The CRM made a booking link without a token');
  return token;
}
