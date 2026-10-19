import { NextRequest } from 'next/server';
import { handleMcpPost, mcpMethodNotAllowed } from '@/lib/crm/mcp';

// MCP endpoint for Claude Code and other clients that can send an Authorization header:
//   claude mcp add --transport http taam https://taammarketing.com/api/mcp --header "Authorization: Bearer taam_…"

export const dynamic = 'force-dynamic';

export function POST(request: NextRequest) {
  return handleMcpPost(request);
}

export { mcpMethodNotAllowed as GET, mcpMethodNotAllowed as DELETE };
