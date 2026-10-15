import { lookup } from 'dns/promises';
import { isIP } from 'net';

// Fetches a visitor-supplied URL for the free tools without letting it reach our own network:
// http(s) on standard ports only, every hop's hostname must resolve to public addresses,
// redirects are followed by hand so each one is re-checked, and the body is size-capped.

const MAX_REDIRECTS = 4;
const MAX_BYTES = 3 * 1024 * 1024;
const TIMEOUT_MS = 12_000;

export class UnsafeUrlError extends Error {}

function isPrivateV4(ip: string): boolean {
  const [a, b] = ip.split('.').map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateV4(ip);
  const lower = ip.toLowerCase();
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateV4(mapped[1]);
  return (
    lower === '::' ||
    lower === '::1' ||
    lower.startsWith('fc') ||
    lower.startsWith('fd') ||
    /^fe[89ab]/.test(lower)
  );
}

/** Turns "example.com" or "https://example.com/x" into a URL, or throws UnsafeUrlError. */
export function normalizeUrl(input: string): URL {
  const raw = input.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new UnsafeUrlError("That doesn't look like a web address.");
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError('Only http and https addresses can be checked.');
  }
  if (url.port && url.port !== '80' && url.port !== '443') {
    throw new UnsafeUrlError('Only standard web ports can be checked.');
  }
  if (url.username || url.password || !url.hostname.includes('.')) {
    throw new UnsafeUrlError("That doesn't look like a public website.");
  }
  url.hash = '';
  return url;
}

async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (addresses.length === 0) {
    throw new UnsafeUrlError("We couldn't find that website. Check the address and try again.");
  }
  if (addresses.some((a) => isPrivateIp(a.address))) {
    throw new UnsafeUrlError("That doesn't look like a public website.");
  }
}

export interface FetchedPage {
  finalUrl: string;
  status: number;
  html: string;
  redirects: number;
  responseMs: number;
}

export async function fetchPublicPage(start: URL): Promise<FetchedPage> {
  let url = start;
  const began = Date.now();

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url.hostname);

    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TAAM-SEO-Grader/1.0; +https://taammarketing.com/tools/seo-grader)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      url = normalizeUrl(new URL(location, url).toString());
      continue;
    }

    const type = res.headers.get('content-type') ?? '';
    if (!type.includes('html')) {
      throw new UnsafeUrlError("That address didn't return a web page.");
    }

    return {
      finalUrl: url.toString(),
      status: res.status,
      html: await readCapped(res),
      redirects: hop,
      responseMs: Date.now() - began,
    };
  }

  throw new UnsafeUrlError('That page redirects too many times.');
}

async function readCapped(res: Response): Promise<string> {
  if (!res.body) return '';
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  await reader.cancel().catch(() => {});
  return new TextDecoder().decode(Buffer.concat(chunks).subarray(0, MAX_BYTES));
}
