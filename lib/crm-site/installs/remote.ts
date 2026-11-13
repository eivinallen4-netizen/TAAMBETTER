import { lookup as dnsLookup, type LookupAddress } from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import { isIP, type LookupFunction } from 'node:net';
import { z } from 'zod';

// Reads one client install's summary: GET <site><api>/v1/summary with its API key
// (the CRM's get_install_summary operation). Server-side only. The install is someone else's
// server, so the call is boxed in: one 6 second budget for every attempt, no redirects, at most
// 64 KB of answer, and the answer is validated before anything is kept. In production the
// address must be https on a public host name (no IP literals, no private networks); local
// development may use http://localhost. The private-network check runs inside the connection's
// own DNS lookup, so the address that was checked is the one the request connects to (a host
// cannot answer with a public address for the check and a private one for the request).

export const INSTALL_STATUSES = ['ok', 'unreachable', 'unauthorized', 'forbidden', 'outdated', 'rate_limited', 'error'] as const;
export type InstallStatus = (typeof INSTALL_STATUSES)[number];

/** Where the CRM's API usually lives on a client site: the embedded install, then a standalone one. */
export const API_PATHS = ['/api/crm', '/api'] as const;

const TIMEOUT_MS = 6000;
const MAX_BYTES = 64 * 1024;

const zCount = z.number().int().nonnegative().nullable().catch(null);
const zMoneyCount = z
  .object({ count: z.number().int().nonnegative(), balance_cents: z.number().int() })
  .nullable()
  .catch(null);

export const zSummary = z.object({
  crm: z.object({ version: z.string().max(40) }),
  schema_version: z.union([z.string().max(80), z.number()]).nullable().optional(),
  company: z
    .object({
      name: z.string().max(200).catch(''),
      timezone: z.string().max(80).catch(''),
      currency: z.string().max(10).catch(''),
    })
    .partial()
    .catch({}),
  industry: z.string().max(40).catch(''),
  modules: z.array(z.string().max(60)).max(100).catch([]),
  links: z.object({ admin: z.string().max(500).catch('') }).partial().catch({}),
  counts: z
    .object({
      clients: zCount,
      open_leads: zCount,
      new_requests: zCount,
      requests_this_month: zCount,
      open_jobs: zCount,
      quotes_awaiting: zCount,
      unpaid_invoices: zMoneyCount,
      overdue_invoices: zMoneyCount,
    })
    .partial()
    .catch({}),
  generated_at: z.string().max(60).catch(''),
});

export type InstallSummary = z.infer<typeof zSummary>;

export interface FetchResult {
  status: InstallStatus;
  /** Plain words for the screen. Empty when ok. */
  error: string;
  /** The API path that answered, e.g. "/api/crm". Empty when none did. */
  apiPath: string;
  summary?: InstallSummary;
}

// ---------- Addresses ----------

const isProduction = () => process.env.NODE_ENV === 'production';

const BLOCKED_SUFFIXES = ['.localhost', '.local', '.internal', '.lan', '.home', '.home.arpa', '.intranet', '.corp'];

function privateIpv4(ip: string): boolean {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
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

/** The eight 16-bit groups of an IPv6 address, or null when it does not parse. */
function ipv6Groups(ip: string): number[] | null {
  let text = ip.toLowerCase().replace(/^\[|\]$/g, '').replace(/%.*$/, '');
  // A dotted IPv4 tail ("::ffff:10.0.0.1") becomes two groups.
  const tail = /(\d+\.\d+\.\d+\.\d+)$/.exec(text);
  if (tail) {
    const p = tail[1].split('.').map(Number);
    if (p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
    text = text.slice(0, -tail[1].length) + `${((p[0] << 8) | p[1]).toString(16)}:${((p[2] << 8) | p[3]).toString(16)}`;
  }
  const halves = text.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const rest = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const fill = halves.length === 2 ? 8 - head.length - rest.length : 0;
  if (fill < 0 || (halves.length === 1 && head.length !== 8)) return null;
  const groups = [...head, ...Array<string>(fill).fill('0'), ...rest].map((g) => (/^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN));
  return groups.length === 8 && groups.every((g) => Number.isInteger(g)) ? groups : null;
}

const v4From = (hi: number, lo: number) => `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;

function privateIp(ip: string): boolean {
  if (isIP(ip) === 4) return privateIpv4(ip);
  const g = ipv6Groups(ip);
  if (!g) return true;
  const zeros = (from: number, to: number) => g.slice(from, to).every((x) => x === 0);
  // ::a.b.c.d (IPv4-compatible, which also covers :: and ::1) and ::ffff:a.b.c.d (IPv4-mapped)
  if (zeros(0, 5) && (g[5] === 0 || g[5] === 0xffff)) return privateIpv4(v4From(g[6], g[7]));
  // 64:ff9b::/96 (NAT64) carries an IPv4 address in its last 32 bits
  if (g[0] === 0x64 && g[1] === 0xff9b && zeros(2, 6)) return privateIpv4(v4From(g[6], g[7]));
  // 64:ff9b:1::/48 (local NAT64)
  if (g[0] === 0x64 && g[1] === 0xff9b && g[2] === 1) return true;
  // 2002::/16 (6to4) carries an IPv4 address in groups 1 and 2
  if (g[0] === 0x2002) return privateIpv4(v4From(g[1], g[2]));
  // 2001::/32 (Teredo) hides an obfuscated IPv4 address; 2001:db8::/32 is documentation only
  if (g[0] === 0x2001 && (g[1] === 0 || g[1] === 0xdb8)) return true;
  // 100::/64 discard
  if (g[0] === 0x100 && zeros(1, 4)) return true;
  // fc00::/7 unique local, fe80::/10 link local, fec0::/10 site local, ff00::/8 multicast
  return (g[0] & 0xfe00) === 0xfc00 || (g[0] & 0xffc0) === 0xfe80 || (g[0] & 0xffc0) === 0xfec0 || (g[0] & 0xff00) === 0xff00;
}

/**
 * The DNS lookup the connection itself uses in production: resolves the name, refuses it when
 * any answer is a private or local address, and hands the checked address to the socket.
 */
const publicLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { ...options, all: true, verbatim: true }, (error, addresses: LookupAddress[]) => {
    if (error) {
      (callback as (e: Error) => void)(new UnreachableError(`${hostname} could not be found. Check the address.`));
      return;
    }
    if (!addresses.length || addresses.some((a) => privateIp(a.address))) {
      (callback as (e: Error) => void)(new BlockedError('That address points at a private network, so it cannot be checked from here.'));
      return;
    }
    if (options.all) (callback as (e: null, a: LookupAddress[]) => void)(null, addresses);
    else (callback as (e: null, a: string, f: number) => void)(null, addresses[0].address, addresses[0].family);
  });
};

/** For tests: whether an address counts as private. */
export const isPrivateAddress = privateIp;

/**
 * Checks and tidies a client site address: returns its origin ("https://crm.client.com"), or
 * throws an Error whose message can be shown. Paths, queries and logins in the URL are dropped
 * or refused.
 */
export function normalizeSiteUrl(input: string): string {
  let raw = input.trim();
  if (!raw) throw new Error('Enter the address of the client site.');
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('That is not a web address. Use something like https://crm.client.com');
  }
  if (url.username || url.password) throw new Error('Leave the login out of the address; the API key is sent separately.');
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('The address must start with https://');
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (isProduction()) {
    if (url.protocol !== 'https:') throw new Error('The address must use https://');
    const bare = host.replace(/^\[|\]$/g, '');
    if (isIP(bare)) throw new Error('Use the site\'s domain name, not an IP address.');
    if (!host.includes('.') || host === 'localhost' || BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) {
      throw new Error('That address is not on the public internet.');
    }
  }
  return url.origin;
}

class UnreachableError extends Error {}
class BlockedError extends Error {}
class RedirectError extends Error {}

/** The admin link from a summary, kept only when it is on the same site; otherwise <site>/admin. */
export function adminUrlFor(origin: string, summary: InstallSummary | undefined): string {
  const given = summary?.links?.admin ?? '';
  if (given) {
    try {
      const url = new URL(given, origin);
      if (url.origin === origin) return url.toString();
    } catch {
      // fall through to the default
    }
  }
  return `${origin}/admin`;
}

// ---------- The call ----------

type Attempt =
  | { kind: 'answer'; status: number; body: unknown }
  | { kind: 'not_crm' };

class TooLargeError extends Error {}

interface RawResponse {
  status: number;
  type: string;
  text: string;
}

/**
 * One GET with node:http(s) rather than fetch, so the connection can use publicLookup in
 * production. Never follows a redirect and stops reading past MAX_BYTES.
 */
function get(url: URL, apiKey: string, signal: AbortSignal): Promise<RawResponse> {
  return new Promise<RawResponse>((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http;
    const request = client.request(
      url,
      {
        method: 'GET',
        headers: { authorization: `Bearer ${apiKey}`, accept: 'application/json' },
        agent: false,
        signal,
        ...(isProduction() ? { lookup: publicLookup } : {}),
      },
      (response) => {
        const status = response.statusCode ?? 0;
        if (status >= 300 && status < 400) {
          response.destroy();
          reject(new RedirectError());
          return;
        }
        const declared = Number(response.headers['content-length'] ?? '');
        if (Number.isFinite(declared) && declared > MAX_BYTES) {
          response.destroy();
          reject(new TooLargeError());
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        response.on('data', (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_BYTES) {
            response.destroy();
            reject(new TooLargeError());
            return;
          }
          chunks.push(chunk);
        });
        response.on('end', () => resolve({ status, type: String(response.headers['content-type'] ?? ''), text: Buffer.concat(chunks).toString('utf8') }));
        response.on('error', reject);
      }
    );
    request.on('error', reject);
    request.end();
  });
}

async function attempt(origin: string, apiPath: string, apiKey: string, signal: AbortSignal): Promise<Attempt> {
  const response = await get(new URL(`${origin}${apiPath}/v1/summary`), apiKey, signal);
  const { type, text } = response;
  if (!type.includes('json')) return { kind: 'not_crm' };
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { kind: 'not_crm' };
  }
  // A 404 from a CRM names the missing endpoint; any other 404 means there is no CRM on this path.
  if (response.status === 404) {
    const message = body && typeof body === 'object' ? String((body as { error?: unknown }).error ?? '') : '';
    return /no such endpoint/i.test(message) ? { kind: 'answer', status: 404, body } : { kind: 'not_crm' };
  }
  return { kind: 'answer', status: response.status, body };
}

function fromAnswer(status: number, body: unknown, apiPath: string): FetchResult {
  const fail = (s: InstallStatus, error: string): FetchResult => ({ status: s, error, apiPath });
  if (status === 401) return fail('unauthorized', 'The install did not accept this API key. Make a new key on that install and paste it here.');
  if (status === 403) return fail('forbidden', 'This API key cannot read the summary. On that install, make a key with "Summary only" access.');
  if (status === 404) return fail('outdated', 'This install runs an older CRM without the summary endpoint. Update it to the latest version.');
  if (status === 429) return fail('rate_limited', 'The install is asking us to slow down. Try again in a minute.');
  if (status < 200 || status >= 300) return fail('error', `The install answered with an error (${status}).`);
  const parsed = zSummary.safeParse(body);
  if (!parsed.success) return fail('error', 'The install answered, but not with a summary this CRM understands.');
  return { status: 'ok', error: '', apiPath, summary: parsed.data };
}

/**
 * Fetches an install's summary. Tries `preferredPath` first when given, then the usual API paths.
 * Never throws: every failure comes back as a status and a message.
 */
export async function fetchSummary(siteUrl: string, apiKey: string, preferredPath = ''): Promise<FetchResult> {
  let origin: string;
  try {
    origin = normalizeSiteUrl(siteUrl);
  } catch (error) {
    return { status: 'error', error: error instanceof Error ? error.message : 'Bad address', apiPath: '' };
  }
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  const paths = [...new Set([preferredPath, ...API_PATHS].filter(Boolean))];
  try {
    for (const path of paths) {
      const result = await attempt(origin, path, apiKey, signal);
      if (result.kind === 'answer') return fromAnswer(result.status, result.body, path);
    }
    return { status: 'error', error: 'No CRM answered at this address. Check that it is the client\'s CRM site.', apiPath: '' };
  } catch (error) {
    if (error instanceof BlockedError) return { status: 'error', error: error.message, apiPath: '' };
    if (error instanceof UnreachableError) return { status: 'unreachable', error: error.message, apiPath: '' };
    if (error instanceof TooLargeError) return { status: 'error', error: 'The install sent back far more than a summary, so it was ignored.', apiPath: '' };
    if (error instanceof RedirectError) return { status: 'unreachable', error: 'The install redirected to another address. Use the final address of the CRM site.', apiPath: '' };
    if (signal.aborted) return { status: 'unreachable', error: 'The install did not answer within 6 seconds.', apiPath: '' };
    // A refused connection, a reset or a bad certificate.
    return { status: 'unreachable', error: 'Could not connect to the install (it may be down, or its certificate is not valid).', apiPath: '' };
  }
}
