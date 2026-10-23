import { NextRequest } from 'next/server';
import { apiJson, authenticateApiKey } from '@/lib/api-auth';
import { OpError, matchOperation } from '@/lib/crm/operations';

// The TAAM CRM REST API. Every route is an operation in lib/crm/operations.ts; the spec is at
// /api/v1/openapi.json. Auth: Authorization: Bearer taam_… (make keys at /admin/api-keys).

export const dynamic = 'force-dynamic';

async function handle(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const match = matchOperation(request.method, `/${path.join('/')}`);
  if (!match) return apiJson({ error: `No route for ${request.method} /api/v1/${path.join('/')}. See /api/v1/openapi.json` }, 404);

  const auth = await authenticateApiKey(request);
  if ('error' in auth) return auth.error;

  let body: Record<string, unknown> = {};
  if (request.method === 'POST' || request.method === 'PATCH') {
    const raw = await request.text();
    // Cold-call lead batches carry two DMs each, so allow a big board in one call.
    if (raw.length > 2_000_000) return apiJson({ error: 'Body too large' }, 413);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) body = parsed;
        else return apiJson({ error: 'Body must be a JSON object' }, 400);
      } catch {
        return apiJson({ error: 'Invalid JSON' }, 400);
      }
    }
  }
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());

  try {
    const result = await match.op.run(
      { ...query, ...body, ...match.params },
      { db: auth.db, origin: request.nextUrl.origin, actor: auth.key }
    );
    return apiJson(result, request.method === 'POST' ? 201 : 200);
  } catch (error) {
    if (error instanceof OpError) return apiJson({ error: error.message }, error.status);
    console.error(`API v1 ${match.op.name} error:`, error);
    return apiJson({ error: 'Internal server error' }, 500);
  }
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
