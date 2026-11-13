import { crm } from '@/crm';

// The CRM's API: the staff screens, REST (v1), MCP, customer pages, webhooks and cron.
export const maxDuration = 60;

export const { GET, POST, PATCH, PUT, DELETE } = crm.handlers;
