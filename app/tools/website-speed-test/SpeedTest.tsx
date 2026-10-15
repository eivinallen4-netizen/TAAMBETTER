'use client';

import { useEffect, useState } from 'react';
import { getTool } from '@/app/lib/tools';
import type { SpeedReport, SpeedResult } from '@/app/lib/tool-types';
import { SPEED_FIX_FALLBACK, SPEED_FIX_NOTES } from '@/app/lib/tool-reports';
import EmailGate from '@/components/tools/EmailGate';
import ResultCTA from '@/components/tools/ResultCTA';
import ScoreRing from '@/components/tools/ScoreRing';
import StatusMark from '@/components/tools/StatusMark';
import UrlForm from '@/components/tools/UrlForm';

const tool = getTool('website-speed-test');

const PROGRESS = [
  'Loading your site on a simulated mid-range phone…',
  'Measuring how long the main content takes to appear…',
  'Checking for layout shifts and blocking scripts…',
  'Running the same test on desktop…',
  'Ranking the fixes by time saved…',
];

function metricStatus(score: number | null) {
  if (score === null) return 'warn' as const;
  return score >= 0.9 ? ('pass' as const) : score >= 0.5 ? ('warn' as const) : ('fail' as const);
}

export default function SpeedTest() {
  const [report, setReport] = useState<SpeedReport | null>(null);
  const [device, setDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) return;
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, PROGRESS.length - 1)), 6000);
    return () => clearInterval(timer);
  }, [loading]);

  async function run(url: string) {
    setLoading(true);
    setStep(0);
    setError(null);
    setReport(null);
    try {
      const res = await fetch('/api/tools/pagespeed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setReport(data);
      setDevice('mobile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const result: SpeedResult | null = report ? report[device] : null;

  return (
    <div className="space-y-14">
      <div className="max-w-4xl">
        <p className="eyebrow mb-5">Enter your website</p>
        <UrlForm onSubmit={run} loading={loading} buttonLabel="Test my speed" loadingLabel="Testing…" />
        {error && <p role="alert" className="mt-5 text-lg font-semibold text-taam-orange">{error}</p>}
      </div>

      <div aria-live="polite">
        {loading && (
          <div className="max-w-4xl">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-taam-orange transition-[width] duration-[6000ms] ease-linear"
                style={{ width: `${((step + 1) / PROGRESS.length) * 92}%` }}
              />
            </div>
            <p className="mt-5 text-lg font-semibold">{PROGRESS[step]}</p>
            <p className="mt-1 text-[color:var(--tone-muted)] font-medium">This uses Google&apos;s own test and takes 20–40 seconds.</p>
          </div>
        )}

        {report && result && (
          <div className="space-y-14">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm font-semibold text-[color:var(--tone-muted)] break-all">{report.url}</p>
              <div role="tablist" aria-label="Device" className="inline-flex rounded-full p-1 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25)]">
                {(['mobile', 'desktop'] as const).map((d) => (
                  <button
                    key={d}
                    role="tab"
                    aria-selected={device === d}
                    onClick={() => setDevice(d)}
                    className={`eyebrow rounded-full px-5 py-3 transition-colors ${device === d ? 'bg-white text-taam-near-black' : ''}`}
                  >
                    {d} · {report[d].scores.performance}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-12 gap-x-6 gap-y-12 items-start">
              <div className="col-span-12 md:col-span-4">
                <ScoreRing score={result.scores.performance} label={`${device} performance`} />
              </div>
              <div className="col-span-12 md:col-span-8 grid grid-cols-3 gap-6">
                <ScoreRing size="sm" score={result.scores.seo} label="SEO" />
                <ScoreRing size="sm" score={result.scores.accessibility} label="Accessibility" />
                <ScoreRing size="sm" score={result.scores.bestPractices} label="Best practices" />
              </div>
            </div>

            {result.fieldVerdict && (
              <p className="lede max-w-3xl">
                Real Chrome users rate this site&apos;s Core Web Vitals as{' '}
                <strong className="font-black">{result.fieldVerdict === 'FAST' ? 'good' : result.fieldVerdict === 'AVERAGE' ? 'needs improvement' : 'poor'}</strong>{' '}
                on {device}. That&apos;s the data Google uses for rankings.
              </p>
            )}

            <div>
              <h3 className="eyebrow mb-5">Core Web Vitals &amp; load metrics</h3>
              <ul className="border-t-2 rule">
                {result.metrics.map((m) => (
                  <li key={m.id} className="flex items-center gap-5 border-b-2 rule py-5">
                    <StatusMark status={metricStatus(m.score)} />
                    <span className="flex-1 text-lg font-bold">{m.label}</span>
                    <span className="display text-2xl md:text-3xl">{m.display}</span>
                  </li>
                ))}
              </ul>
            </div>

            {result.opportunities.length > 0 && (
              <EmailGate
                tool={tool}
                website={report.url}
                report={report}
                summary={`Speed test for ${report.url}: mobile ${report.mobile.scores.performance}/100, desktop ${report.desktop.scores.performance}/100. Top fixes (mobile): ${report.mobile.opportunities.slice(0, 4).map((o) => o.title).join('; ') || 'none'}.`}
                teaser={[
                  `The ${result.opportunities.length} fixes slowing this site down, ranked by time saved`,
                  'What each one means in plain English, and how to fix it',
                  'Separate fix lists for mobile and desktop',
                ]}
              >
                <ol className="border-t-2 rule">
                  {result.opportunities.map((o, i) => (
                    <li key={o.id} className="grid grid-cols-12 gap-x-6 gap-y-3 border-b-2 rule py-8">
                      <span className="col-span-12 md:col-span-1 eyebrow pt-1">Fix {String(i + 1).padStart(2, '0')}</span>
                      <div className="col-span-12 md:col-span-4">
                        <h3 className="display display-sm">{o.title}</h3>
                        {o.savings && <p className="mt-2 font-bold text-taam-orange">Saves about {o.savings}</p>}
                      </div>
                      <p className="col-span-12 md:col-span-7 text-lg leading-relaxed font-medium">
                        {SPEED_FIX_NOTES[o.id] ?? SPEED_FIX_FALLBACK}
                      </p>
                    </li>
                  ))}
                </ol>
              </EmailGate>
            )}

            <ResultCTA tool={tool} hook={`Your mobile score is ${report.mobile.scores.performance}/100`} />
          </div>
        )}
      </div>
    </div>
  );
}
