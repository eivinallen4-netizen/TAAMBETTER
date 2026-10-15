// Minimal HubSpot CRM client for free-tool leads: upsert the contact by email, then log the report
// as a note on their timeline. Needs a private app token with crm.objects.contacts.read/write.

const API = 'https://api.hubapi.com';

async function hubspot<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`HubSpot ${path} ${res.status}: ${await res.text().catch(() => '')}`);
  return res.json() as Promise<T>;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export interface ToolLeadForCrm {
  email: string;
  firstName: string;
  website: string;
  toolName: string;
  toolUrl: string;
  summary: string;
  emailed: boolean;
}

/** No-op without HUBSPOT_ACCESS_TOKEN. Throws on API errors so the caller can log them. */
export async function syncToolLeadToHubSpot(lead: ToolLeadForCrm): Promise<void> {
  if (!process.env.HUBSPOT_ACCESS_TOKEN) return;

  // Only send fields we have, so a repeat visitor's existing name or site is never blanked out.
  const properties: Record<string, string> = { email: lead.email };
  if (lead.firstName) properties.firstname = lead.firstName;
  if (lead.website) properties.website = lead.website;

  const upsert = await hubspot<{ results: { id: string }[] }>('/crm/v3/objects/contacts/batch/upsert', {
    inputs: [{ idProperty: 'email', id: lead.email, properties }],
  });
  const contactId = upsert.results[0]?.id;
  if (!contactId) return;

  await hubspot('/crm/v3/objects/notes', {
    properties: {
      hs_timestamp: new Date().toISOString(),
      hs_note_body:
        `<p><strong>Free tool lead: ${esc(lead.toolName)}</strong></p>` +
        `<p>${esc(lead.summary)}</p>` +
        `<p>Tool: ${esc(lead.toolUrl)}<br>Report email: ${lead.emailed ? 'sent' : 'not sent'}</p>`,
    },
    // 202 = note → contact (HubSpot-defined association).
    associations: [{ to: { id: contactId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 }] }],
  });
}
