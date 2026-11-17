import { OpError } from '@taam/crm/server';

// Talks to the TAAM Site Review app (its own repo, "09 Site Feedback", deployed on its own
// subdomain such as https://review.taammarketing.com). That app shows the client's live site
// through a proxy, so it needs a whole domain to itself and can't live inside this website.
// This website keeps no copy of the data: every call goes to <REVIEW_APP_URL>/api/fb/v1 with
// the shared key REVIEW_APP_KEY (HOST_API_KEY on the review app). Server-side only.

const TIMEOUT_MS = 10_000;

export function reviewsConfig(): { url: string; key: string } | null {
  const url = (process.env.REVIEW_APP_URL ?? '').trim().replace(/\/+$/, '');
  const key = (process.env.REVIEW_APP_KEY ?? '').trim();
  if (!url || key.length < 24) return null;
  try {
    const u = new URL(url);
    // Production must use https; local development may point at http://localhost.
    if (u.protocol !== 'https:' && !(u.protocol === 'http:' && /^(localhost|127\.0\.0\.1)$/.test(u.hostname))) return null;
  } catch {
    return null;
  }
  return { url, key };
}

export const reviewsConfigured = () => reviewsConfig() !== null;

export function requireReviews() {
  const cfg = reviewsConfig();
  if (!cfg) throw new OpError(503, 'Site reviews are not connected yet: set REVIEW_APP_URL and REVIEW_APP_KEY on this server.');
  return cfg;
}

/** One call to the review app. Its error message is passed on; anything else becomes a plain 502. */
export async function reviewApi<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const { url, key } = requireReviews();
  let res: Response;
  try {
    res = await fetch(`${url}/api/fb/v1${path}`, {
      method,
      headers: { authorization: `Bearer ${key}`, accept: 'application/json', ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError';
    throw new OpError(502, timedOut ? 'The review app took too long to answer.' : 'The review app could not be reached.');
  }
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok) {
    if (res.status === 401) throw new OpError(502, 'The review app rejected REVIEW_APP_KEY. It must match HOST_API_KEY on the review app.');
    const status = res.status === 400 || res.status === 404 || res.status === 409 ? res.status : 502;
    throw new OpError(status, data?.error || `The review app answered ${res.status}.`);
  }
  if (!data) throw new OpError(502, 'The review app sent back something unreadable.');
  return data;
}
