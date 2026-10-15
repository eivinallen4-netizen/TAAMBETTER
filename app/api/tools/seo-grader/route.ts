import { NextRequest } from 'next/server';
import { createRateLimiter, handleRateLimit } from '@/lib/ratelimit';
import { getClientIp } from '@/lib/logger';
import { UnsafeUrlError } from '@/lib/safe-fetch';
import { gradePage, PageStatusError } from '@/lib/seo-grade';

export const maxDuration = 30;

const graderLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, maxRequests: 30 });

export async function POST(request: NextRequest) {
  const limit = graderLimiter(request, `seo-grader:${getClientIp(request.headers)}`);
  if (!limit.allowed) return handleRateLimit(limit.resetTime!);

  let input = '';
  try {
    const body = await request.json();
    input = typeof body.url === 'string' ? body.url : '';
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    return Response.json(await gradePage(input));
  } catch (err) {
    if (err instanceof UnsafeUrlError || err instanceof PageStatusError) {
      return Response.json({ error: err.message }, { status: 422 });
    }
    const timedOut = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    return Response.json(
      { error: timedOut ? 'That site took too long to respond. Try again in a minute.' : "We couldn't reach that site. Check the address and try again." },
      { status: 502 }
    );
  }
}
