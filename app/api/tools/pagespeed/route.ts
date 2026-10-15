import { NextRequest } from 'next/server';
import { createRateLimiter, handleRateLimit } from '@/lib/ratelimit';
import { getClientIp } from '@/lib/logger';
import { normalizeUrl, UnsafeUrlError } from '@/lib/safe-fetch';
import type { SpeedReport, SpeedResult } from '@/app/lib/tool-types';

// Runs Google PageSpeed Insights for mobile and desktop in parallel and trims the (huge) Lighthouse
// payload to what the speed-test page shows. Set PAGESPEED_API_KEY for a usable quota.

export const maxDuration = 60;

const speedLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, maxRequests: 12 });

const CACHE_MS = 15 * 60 * 1000;
const cache = new Map<string, { at: number; report: SpeedReport }>();

const METRICS: { id: string; label: string }[] = [
  { id: 'largest-contentful-paint', label: 'Largest Contentful Paint' },
  { id: 'cumulative-layout-shift', label: 'Cumulative Layout Shift' },
  { id: 'total-blocking-time', label: 'Total Blocking Time' },
  { id: 'first-contentful-paint', label: 'First Contentful Paint' },
  { id: 'speed-index', label: 'Speed Index' },
];

interface LighthouseAudit {
  title?: string;
  score?: number | null;
  displayValue?: string;
  details?: { type?: string; overallSavingsMs?: number };
  metricSavings?: Record<string, number>;
}

interface PsiResponse {
  loadingExperience?: { overall_category?: string };
  lighthouseResult?: {
    categories?: Record<string, { score: number | null }>;
    audits?: Record<string, LighthouseAudit>;
  };
  error?: { message?: string };
}

async function runPsi(url: string, strategy: 'mobile' | 'desktop'): Promise<SpeedResult> {
  const api = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  api.searchParams.set('url', url);
  api.searchParams.set('strategy', strategy);
  for (const c of ['performance', 'accessibility', 'best-practices', 'seo']) api.searchParams.append('category', c);
  if (process.env.PAGESPEED_API_KEY) api.searchParams.set('key', process.env.PAGESPEED_API_KEY);

  const res = await fetch(api, { signal: AbortSignal.timeout(55_000), cache: 'no-store' });
  const data = (await res.json()) as PsiResponse;
  if (!res.ok || !data.lighthouseResult) {
    throw new Error(data.error?.message || `PageSpeed request failed (${res.status})`);
  }

  const { categories = {}, audits = {} } = data.lighthouseResult;
  const pct = (key: string) => Math.round((categories[key]?.score ?? 0) * 100);

  const opportunities = Object.entries(audits)
    .map(([id, a]) => {
      const fromMetrics = Math.max(0, ...Object.values(a.metricSavings ?? {}).filter((v) => typeof v === 'number'));
      const savingsMs = a.details?.overallSavingsMs ?? fromMetrics;
      return { id, a, savingsMs };
    })
    .filter(({ a, savingsMs }) => typeof a.score === 'number' && a.score < 0.9 && savingsMs >= 50 && a.title)
    .sort((x, y) => y.savingsMs - x.savingsMs)
    .slice(0, 8)
    .map(({ id, a, savingsMs }) => ({
      id,
      title: a.title!.replace(/`/g, ''),
      savingsMs: Math.round(savingsMs),
      savings: savingsMs >= 50 ? `${(savingsMs / 1000).toFixed(1)} s` : null,
    }));

  const verdict = data.loadingExperience?.overall_category;

  return {
    scores: {
      performance: pct('performance'),
      accessibility: pct('accessibility'),
      bestPractices: pct('best-practices'),
      seo: pct('seo'),
    },
    metrics: METRICS.map(({ id, label }) => ({
      id,
      label,
      display: audits[id]?.displayValue ?? '—',
      score: audits[id]?.score ?? null,
    })),
    opportunities,
    fieldVerdict: verdict === 'FAST' || verdict === 'AVERAGE' || verdict === 'SLOW' ? verdict : null,
  };
}

export async function POST(request: NextRequest) {
  let input = '';
  try {
    const body = await request.json();
    input = typeof body.url === 'string' ? body.url : '';
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  let url: string;
  try {
    url = normalizeUrl(input).toString();
  } catch (err) {
    return Response.json({ error: err instanceof UnsafeUrlError ? err.message : 'Invalid address' }, { status: 422 });
  }

  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return Response.json(hit.report);
  }

  const limit = speedLimiter(request, `pagespeed:${getClientIp(request.headers)}`);
  if (!limit.allowed) return handleRateLimit(limit.resetTime!);

  try {
    const [mobile, desktop] = await Promise.all([runPsi(url, 'mobile'), runPsi(url, 'desktop')]);
    const report: SpeedReport = { url, mobile, desktop };
    cache.set(url, { at: Date.now(), report });
    return Response.json(report);
  } catch (err) {
    console.error('PageSpeed failed:', err);
    const message = err instanceof Error ? err.message : '';
    const unreachable = /FAILED_DOCUMENT_REQUEST|ERRORED_DOCUMENT_REQUEST|DNS|NO_FCP|unreachable/i.test(message);
    return Response.json(
      {
        error: unreachable
          ? "Google couldn't load that page. Check the address, or make sure the site isn't blocking crawlers."
          : 'The speed test is busy right now. Give it a minute and try again.',
      },
      { status: 502 }
    );
  }
}
