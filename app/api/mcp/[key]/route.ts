import { forwardToCrm } from '@/lib/crm-route';

// The MCP endpoint with the key in the address, for connectors that cannot send a header.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const { GET, POST, DELETE } = forwardToCrm((params) => ['mcp', String(params.key ?? '')]);
