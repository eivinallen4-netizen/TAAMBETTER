'use client';

import { useState } from 'react';
import { getTool } from '@/app/lib/tools';
import type { SeoCheck, SeoReport } from '@/app/lib/tool-types';
import { sortSeoIssues } from '@/app/lib/tool-reports';
import EmailGate from '@/components/tools/EmailGate';
import ResultCTA from '@/components/tools/ResultCTA';
import ScoreRing from '@/components/tools/ScoreRing';
import StatusMark from '@/components/tools/StatusMark';
import UrlForm from '@/components/tools/UrlForm';

const tool = getTool('seo-grader');

export default function SeoGrader() {
  const [report, setReport] = useState<SeoReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(url: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tools/seo-grader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setReport(data);
    } catch (err) {
      setReport(null);
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  const issues = report?.checks.filter((c) => c.status !== 'pass') ?? [];
  const passed = report ? report.checks.length - issues.length : 0;

  return (
    <div className="space-y-14">
      <div className="max-w-4xl">
        <p className="eyebrow mb-5">Enter any page on your site</p>
        <UrlForm onSubmit={run} loading={loading} buttonLabel="Grade my page" loadingLabel="Grading…" />
        {error && <p role="alert" className="mt-5 text-lg font-semibold text-taam-orange">{error}</p>}
      </div>

      <div aria-live="polite">
        {report && (
          <div className="space-y-14">
            <div className="grid grid-cols-12 gap-x-6 gap-y-10 items-center">
              <div className="col-span-12 md:col-span-4">
                <ScoreRing score={report.score} label="On-page SEO score" />
              </div>
              <div className="col-span-12 md:col-span-8">
                <p className="text-sm font-semibold text-[color:var(--tone-muted)] break-all">{report.url}</p>
                <p className="display display-md mt-3">
                  {issues.length === 0 ? 'Nothing to fix.' : `${issues.length} issue${issues.length === 1 ? '' : 's'} found.`}
                </p>
                <p className="lede mt-4">
                  {passed} of {report.checks.length} checks passed.
                  {issues.length > 0 && ' The full report explains each issue and how to fix it.'}
                </p>
              </div>
            </div>

            {/* Free: what we found. Issues first; passed checks fold away so the fix list stays close. */}
            <div>
              <ul className="border-t-2 rule">
                {issues.map((c) => (
                  <CheckRow key={c.id} check={c} />
                ))}
              </ul>
              {passed > 0 && (
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center gap-5 border-b-2 rule py-5 text-lg font-bold [&::-webkit-details-marker]:hidden">
                    <StatusMark status="pass" />
                    {passed} checks passed
                    <span aria-hidden="true" className="ml-auto text-2xl leading-none transition-transform duration-300 group-open:rotate-45">+</span>
                  </summary>
                  <ul>
                    {report.checks.filter((c) => c.status === 'pass').map((c) => (
                      <CheckRow key={c.id} check={c} />
                    ))}
                  </ul>
                </details>
              )}
            </div>

            {issues.length > 0 && (
              <EmailGate
                tool={tool}
                website={report.url}
                report={{ url: report.url }}
                summary={`SEO score ${report.score}/100 for ${report.url}. Issues: ${issues.map((c) => c.label).join('; ')}.`}
                teaser={[
                  `How to fix each of the ${issues.length} issues, in plain English`,
                  'Which fixes to do first for the biggest ranking lift',
                  'Examples you can hand to whoever runs your site',
                ]}
              >
                <ol className="border-t-2 rule">
                  {sortSeoIssues(report)
                    .map((c, i) => (
                      <li key={c.id} className="grid grid-cols-12 gap-x-6 gap-y-3 border-b-2 rule py-8">
                        <span className="col-span-12 md:col-span-1 eyebrow pt-1">Fix {String(i + 1).padStart(2, '0')}</span>
                        <h3 className="col-span-12 md:col-span-4 display display-sm">{c.label}</h3>
                        <p className="col-span-12 md:col-span-7 text-lg leading-relaxed font-medium">{c.fix}</p>
                      </li>
                    ))}
                </ol>
              </EmailGate>
            )}

            <ResultCTA tool={tool} hook={`Your page scored ${report.score}/100`} />
          </div>
        )}
      </div>
    </div>
  );
}

function CheckRow({ check }: { check: SeoCheck }) {
  return (
    <li className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 border-b-2 rule py-5">
      <StatusMark status={check.status} />
      <span className="text-lg font-bold self-center">{check.label}</span>
      <span className="col-start-2 text-[color:var(--tone-muted)] font-medium break-words">{check.found}</span>
    </li>
  );
}
