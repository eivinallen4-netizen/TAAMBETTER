import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, bearerKey } from '@/lib/api-auth';
import { OPERATIONS, OpError, findOperation } from './operations';

// A stateless MCP server (Streamable HTTP transport, JSON responses, no SSE) over the CRM
// operations, so Claude can use the CRM as a connector. Spec: https://modelcontextprotocol.io

const SUPPORTED_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'];

const INSTRUCTIONS = `TAAM CRM: TAAM is a Las Vegas marketing agency. Use these tools to look up and manage contacts,
make appointment links (a private page where a prospect books a video call with the closer), track whether
links were opened and booked, manage paid-client onboarding, send branded emails, and manage website
cold-call leads (add_coldcall_leads to push researched leads in, log_coldcall to record what happened on a call).
House rules: TAAM never offers discounts — never write "discount", "% off", "deal", "save" or "sale" in emails.
Onboarding is only for clients who have paid. Confirm with the user before deleting anything or sending email.`;

interface RpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

const rpcResult = (id: RpcRequest['id'], result: unknown) => ({ jsonrpc: '2.0', id: id ?? null, result });
const rpcError = (id: RpcRequest['id'], code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

function toolList() {
  return OPERATIONS.map((op) => ({
    name: op.name,
    description: op.description,
    inputSchema: op.input,
    annotations: {
      readOnlyHint: Boolean(op.readOnly),
      destructiveHint: op.method === 'DELETE',
      openWorldHint: op.name === 'send_email',
    },
  }));
}

async function handleOne(msg: RpcRequest, ctx: Parameters<(typeof OPERATIONS)[number]['run']>[1]) {
  const isNotification = msg.id === undefined;
  switch (msg.method) {
    case 'initialize': {
      const asked = String(msg.params?.protocolVersion ?? '');
      return rpcResult(msg.id, {
        protocolVersion: SUPPORTED_VERSIONS.includes(asked) ? asked : SUPPORTED_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'taam-crm', title: 'TAAM CRM', version: '1.0.0' },
        instructions: INSTRUCTIONS,
      });
    }
    case 'ping':
      return rpcResult(msg.id, {});
    case 'tools/list':
      return rpcResult(msg.id, { tools: toolList() });
    case 'tools/call': {
      const op = findOperation(String(msg.params?.name ?? ''));
      if (!op) return rpcError(msg.id, -32602, `Unknown tool: ${String(msg.params?.name)}`);
      const args = (msg.params?.arguments ?? {}) as Record<string, unknown>;
      try {
        const result = await op.run(args, ctx);
        return rpcResult(msg.id, {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          structuredContent: result && typeof result === 'object' && !Array.isArray(result) ? result : { result },
          isError: false,
        });
      } catch (error) {
        const message = error instanceof OpError ? error.message : 'Internal error';
        if (!(error instanceof OpError)) console.error(`MCP ${op.name} error:`, error);
        return rpcResult(msg.id, { content: [{ type: 'text', text: message }], isError: true });
      }
    }
    default:
      // Notifications (notifications/initialized, cancelled, …) need no answer.
      if (isNotification || msg.method?.startsWith('notifications/')) return null;
      return rpcError(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function handleMcpPost(request: NextRequest, key = bearerKey(request)): Promise<NextResponse> {
  const auth = await authenticateApiKey(request, key);
  if ('error' in auth) {
    return NextResponse.json(rpcError(null, -32001, 'Missing or invalid API key'), {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer' },
    });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(rpcError(null, -32700, 'Parse error'), { status: 400 });
  }

  const ctx = { db: auth.db, origin: request.nextUrl.origin, actor: { id: auth.key.id, name: `Claude (${auth.key.name})` } };
  const batch = Array.isArray(payload);
  const messages = (batch ? payload : [payload]) as RpcRequest[];
  const responses = (await Promise.all(messages.map((m) => handleOne(m, ctx)))).filter(Boolean);

  if (responses.length === 0) return new NextResponse(null, { status: 202 });
  return NextResponse.json(batch ? responses : responses[0], { headers: { 'Cache-Control': 'no-store' } });
}

/** No server-initiated stream: GET and DELETE aren't offered. */
export function mcpMethodNotAllowed() {
  return new NextResponse(null, { status: 405, headers: { Allow: 'POST' } });
}
