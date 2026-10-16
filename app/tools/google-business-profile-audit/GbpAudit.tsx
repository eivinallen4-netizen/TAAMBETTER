'use client';

import { useState } from 'react';
import { getTool } from '@/app/lib/tools';
import { GBP_QUESTIONS as QUESTIONS, gbpImpact, scoreGbp, type GbpAnswer as Answer } from '@/app/lib/tool-reports';
import EmailGate from '@/components/tools/EmailGate';
import ResultCTA from '@/components/tools/ResultCTA';
import ScoreRing from '@/components/tools/ScoreRing';
import Arrow from '@/components/editorial/Arrow';

const tool = getTool('google-business-profile-audit');

const GROUPS = [...new Set(QUESTIONS.map((q) => q.group))];

export default function GbpAudit() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [showResult, setShowResult] = useState(false);

  const answered = Object.keys(answers).length;
  const complete = answered === QUESTIONS.length;
  const { score, gaps } = scoreGbp(answers);

  function answer(id: string, value: Answer) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  return (
    <div className="space-y-14">
      <div className="space-y-14">
        {GROUPS.map((group) => (
          <fieldset key={group}>
            <legend className="eyebrow mb-5">{group}</legend>
            <ul className="border-t-2 rule">
              {QUESTIONS.filter((q) => q.group === group).map((q) => (
                <li key={q.id} className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 border-b-2 rule py-5">
                  <span id={`q-${q.id}`} className="flex-1 text-lg font-bold leading-snug">{q.q}</span>
                  <span role="radiogroup" aria-labelledby={`q-${q.id}`} className="flex gap-2">
                    {(['yes', 'no', 'unsure'] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        role="radio"
                        aria-checked={answers[q.id] === v}
                        onClick={() => answer(q.id, v)}
                        className={`eyebrow rounded-full px-5 py-3 transition-colors ${
                          answers[q.id] === v ? 'bg-white text-taam-near-black' : 'shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25)] hover:shadow-[inset_0_0_0_2px_#fff]'
                        }`}
                      >
                        {v === 'unsure' ? 'Not sure' : v}
                      </button>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </fieldset>
        ))}
      </div>

      {!showResult && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <button type="button" disabled={!complete} onClick={() => setShowResult(true)} className="btn btn-solid self-start disabled:opacity-50">
            See my score <Arrow />
          </button>
          <p className="font-semibold text-[color:var(--tone-muted)]">
            {complete ? 'All set.' : `${answered} of ${QUESTIONS.length} answered`}
          </p>
        </div>
      )}

      <div aria-live="polite">
        {showResult && (
          <div className="space-y-14">
            <div className="grid grid-cols-12 gap-x-6 gap-y-10 items-center">
              <div className="col-span-12 md:col-span-4">
                <ScoreRing score={score} label="Profile score" />
              </div>
              <div className="col-span-12 md:col-span-8">
                <p className="display display-md">
                  {gaps.length === 0 ? 'A model profile.' : `${gaps.length} gap${gaps.length === 1 ? '' : 's'} costing you calls.`}
                </p>
                <p className="lede mt-4">
                  {gaps.length === 0
                    ? 'Keep the reviews, photos and posts coming and you will hold your ground.'
                    : `You're doing ${QUESTIONS.length - gaps.length} of ${QUESTIONS.length} things right. The full report ranks the rest by impact and explains each fix.`}
                </p>
              </div>
            </div>

            {gaps.length > 0 && (
              <EmailGate
                tool={tool}
                report={answers}
                summary={`GBP audit score ${score}/100. Gaps: ${gaps.map((g) => g.id).join(', ')}.`}
                teaser={[
                  `Your ${gaps.length} gaps, ranked by how much they affect calls`,
                  'Exactly what to change on the profile for each one',
                  'A simple routine to keep reviews and photos coming in',
                ]}
              >
                <ol className="border-t-2 rule">
                  {gaps.map((g, i) => (
                    <li key={g.id} className="grid grid-cols-12 gap-x-6 gap-y-3 border-b-2 rule py-8">
                      <span className="col-span-12 md:col-span-1 eyebrow pt-1">Fix {String(i + 1).padStart(2, '0')}</span>
                      <div className="col-span-12 md:col-span-4">
                        <h3 className="display display-sm">{g.title}</h3>
                        <p className="mt-2 eyebrow text-taam-orange">{gbpImpact(g.weight)}</p>
                      </div>
                      <p className="col-span-12 md:col-span-7 text-lg leading-relaxed font-medium">{g.fix}</p>
                    </li>
                  ))}
                </ol>
              </EmailGate>
            )}

            <ResultCTA tool={tool} hook={`Your profile scored ${score}/100`} />
          </div>
        )}
      </div>
    </div>
  );
}
