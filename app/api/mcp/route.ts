import { forwardToCrm } from '@/lib/crm-route';

// The MCP endpoint at its original address, so the Claude connector keeps working. The key
// goes in the Authorization header.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const { GET, POST, DELETE } = forwardToCrm(() => ['mcp']);
