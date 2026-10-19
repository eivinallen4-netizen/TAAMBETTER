import { NextRequest } from 'next/server';
import { handleMcpPost, mcpMethodNotAllowed } from '@/lib/crm/mcp';

// The same MCP endpoint with the API key in the URL, for Claude.ai custom connectors (Settings →
// Connectors → Add custom connector), which can't send headers. Treat this URL like a password.

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return handleMcpPost(request, key);
}

export { mcpMethodNotAllowed as GET, mcpMethodNotAllowed as DELETE };
