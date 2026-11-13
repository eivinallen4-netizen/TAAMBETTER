import { forwardToCrm } from '@/lib/crm-route';

// Calendly calls this address on invitee.created / invitee.canceled (registered by
// scripts/calendly-webhook.mjs). The CRM's appointment links handle it.
export const dynamic = 'force-dynamic';

export const { POST } = forwardToCrm(() => ['webhooks', 'calendly']);
