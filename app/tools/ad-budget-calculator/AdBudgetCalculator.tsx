'use client';

import { useState } from 'react';
import { getTool } from '@/app/lib/tools';
import { adPlan, adSummary, num, projectAds, usd, type AdInputs } from '@/app/lib/tool-reports';
import EmailGate from '@/components/tools/EmailGate';
import ResultCTA from '@/components/tools/ResultCTA';

const tool = getTool('ad-budget-calculator');

const FIELDS: { key: keyof AdInputs; label: string; hint: string; prefix?: string; suffix?: string; step: number }[] = [
  { key: 'budget', label: 'Monthly ad budget', hint: 'What you spend on ads each month.', prefix: '$', step: 100 },
  { key: 'cpc', label: 'Average cost per click', hint: 'From your ad account. Local service ads often run $2–$10+.', prefix: '$', step: 0.25 },
  { key: 'conversion', label: 'Landing page conversion rate', hint: 'Share of clicks that call or fill in a form.', suffix: '%', step: 0.5 },
  { key: 'close', label: 'Close rate', hint: 'Share of leads that become paying customers.', suffix: '%', step: 1 },
  { key: 'jobValue', label: 'Average job value', hint: 'Revenue from a typical first job or sale.', prefix: '$', step: 50 },
  { key: 'margin', label: 'Gross margin', hint: 'What you keep after the direct cost of the job.', suffix: '%', step: 5 },
];

export default function AdBudgetCalculator() {
  const [inputs, setInputs] = useState<AdInputs>({ budget: 2000, cpc: 5, conversion: 8, close: 30, jobValue: 900, margin: 50 });
  const r = projectAds(inputs);

  const { economics, levers } = adPlan(inputs);
  const summary = adSummary(inputs);

  return (
    <div className="space-y-14">
      <div className="grid grid-cols-12 gap-x-6 gap-y-12">
        <fieldset className="col-span-12 lg:col-span-5 space-y-7">
          <legend className="eyebrow mb-7">Your numbers</legend>
          {FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="text-lg font-bold">{f.label}</span>
              <span className="mt-2 flex items-center rounded-full bg-white/10 px-6 focus-within:bg-white/15 focus-within:ring-2 focus-within:ring-white">
                {f.prefix && <span className="text-lg font-bold text-white/60">{f.prefix}</span>}
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={f.suffix === '%' ? 100 : undefined}
                  step={f.step}
                  value={Number.isFinite(inputs[f.key]) ? inputs[f.key] : ''}
                  onChange={(e) => setInputs((prev) => ({ ...prev, [f.key]: Math.max(0, parseFloat(e.target.value)) }))}
                  className="min-w-0 flex-1 bg-transparent px-2 py-4 text-lg font-semibold outline-none"
                />
                {f.suffix && <span className="text-lg font-bold text-white/60">{f.suffix}</span>}
              </span>
              <span className="mt-2 block text-sm font-medium text-[color:var(--tone-muted)]">{f.hint}</span>
            </label>
          ))}
        </fieldset>

        <div className="col-span-12 lg:col-span-6 lg:col-start-7" aria-live="polite">
          <p className="eyebrow mb-7">Each month you can expect about</p>
          <dl className="grid grid-cols-2 border-t-2 rule">
            {[
              { k: 'Leads', v: num(r.leads, 1) },
              { k: 'Cost per lead', v: usd(r.cpl) },
              { k: 'New customers', v: num(r.customers, 1) },
              { k: 'Cost per customer', v: usd(r.cpa) },
              { k: 'Revenue', v: usd(r.revenue) },
              { k: 'Return on ad spend', v: Number.isFinite(r.roas) ? `${num(r.roas, 1)}x` : '—' },
            ].map((s, i) => (
              <div key={s.k} className={`border-b-2 rule py-6 ${i % 2 === 0 ? 'pr-4' : 'pl-4 border-l-2'}`}>
                <dt className="eyebrow text-[color:var(--tone-muted)]">{s.k}</dt>
                <dd className="display text-4xl md:text-5xl mt-3">{s.v}</dd>
              </div>
            ))}
          </dl>
          <p className="lede mt-8">
            {r.profit >= 0 ? (
              <>After ad spend and job costs, that&apos;s about <strong className="font-black">{usd(r.profit)}</strong> gross profit a month from ads, from {num(r.clicks)} clicks.</>
            ) : (
              <>At these numbers ads <strong className="font-black">lose about {usd(-r.profit)}</strong> a month after job costs. The plan below shows which lever fixes that fastest.</>
            )}
          </p>
        </div>
      </div>

      <EmailGate
        tool={tool}
        summary={summary}
        report={inputs}
        teaser={[
          'What one lead is really worth to you, and the most you can pay for one',
          'Your break-even cost per click',
          'The three levers that grow profit, with your numbers run for each',
        ]}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 border-t-2 rule">
          {economics.map((s) => (
            <div key={s.k} className="border-b-2 rule py-8">
              <p className="eyebrow text-[color:var(--tone-muted)]">{s.k}</p>
              <p className="display text-5xl mt-3">{s.v}</p>
              <p className="mt-3 font-medium text-[color:var(--tone-muted)]">{s.d}</p>
            </div>
          ))}
        </div>

        <h3 className="display display-sm mt-16 mb-6">Three levers, same budget</h3>
        <ol className="border-t-2 rule">
          {levers.map((l, i) => (
            <li key={l.label} className="grid grid-cols-12 gap-x-6 gap-y-3 border-b-2 rule py-8">
              <span className="col-span-12 md:col-span-1 eyebrow pt-1">0{i + 1}</span>
              <div className="col-span-12 md:col-span-6">
                <p className="text-xl font-bold leading-snug">{l.label}</p>
                <p className="mt-2 font-medium text-[color:var(--tone-muted)]">{l.how}</p>
              </div>
              <p className="col-span-12 md:col-span-5 text-lg font-semibold md:text-right">
                {num(l.p.leads, 1)} leads · {num(l.p.customers, 1)} customers
                <br />
                <span className="text-taam-orange font-black">
                  {l.p.revenue - r.revenue >= 0 ? '+' : ''}
                  {usd(l.p.revenue - r.revenue)} revenue / mo
                </span>
              </p>
            </li>
          ))}
        </ol>
      </EmailGate>

      <ResultCTA tool={tool} hook={Number.isFinite(r.cpl) ? `Your cost per lead: ${usd(r.cpl)}` : undefined} />
    </div>
  );
}
