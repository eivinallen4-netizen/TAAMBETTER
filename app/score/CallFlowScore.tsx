'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Arrow from '@/components/editorial/Arrow';
import Mascot from '@/components/editorial/Mascot';
import SmsConsent from '@/app/components/SmsConsent';
import { trackEvent } from '@/app/lib/track';
import {
  PLAYBOOK,
  QUIZ,
  QUESTION_COUNT,
  computeResult,
  fill,
  nextStep,
  personal,
  pillarAnswer,
  planText,
  type Answers,
  type Pillar,
  type Question,
  type QuizResult,
} from '@/lib/score-quiz';

// The Call Flow Score quiz: one client component, one URL (/score), screens held in state.
// Copy, points and scoring all come from lib/score-quiz.ts; the server recomputes everything.

type Screen = 'landing' | 'name' | 'q' | 'cap' | 'an' | 'res';
type Step = { kind: 'qual' | 'timing'; q: Question } | { kind: 'pillar'; q: Pillar };
type Choice = { value: string; label: string };

const C = QUIZ.config;
const STEPS: Step[] = [
  ...QUIZ.qualifiers.map((q) => ({ kind: 'qual' as const, q })),
  ...QUIZ.pillars.map((q) => ({ kind: 'pillar' as const, q })),
  { kind: 'timing', q: QUIZ.timing },
];
const TOTAL = QUESTION_COUNT;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ADVANCE_MS = 220;
// The booking page lives on this site, so it opens in the same tab.
const BOOKING_HREF = C.bookingUrl.replace(/^https?:\/\/(www\.)?taammarketing\.com/, '') || C.bookingUrl;

const SAMPLE: [string, number][] = [
  ['Website', 65],
  ['Google presence', 50],
  ['Video and social', 35],
  ['Lead flow', 65],
  ['Speed to lead', 20],
  ['Follow-up', 50],
  ['Tracking', 35],
];

const WHAT_YOU_GET: [string, string][] = [
  ['Your score', 'All 7 parts of how calls reach you, scored out of 100, with your next move in each'],
  ['Your #1 gap', 'The one part losing you the most jobs, a 15-minute check and a script to copy'],
  ['Your plan', 'What to fix in the next 30, 60 and 90 days, and how you know each step is done'],
];

function shuffled(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function newEventId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function tradeHeadline(tradeValue: string): string {
  const opt = QUIZ.qualifiers[2].options.find((o) => o.value === tradeValue);
  if (!opt || opt.value === 'other') return QUIZ.landing.headline;
  const name = opt.label === 'HVAC' ? 'HVAC' : opt.label.toLowerCase();
  return QUIZ.landing.headline.replace('your phone', `your ${name} company's phone`);
}

export default function CallFlowScore({ trade, hotLeadPromise }: { trade: string; hotLeadPromise: string }) {
  const [screen, setScreen] = useState<Screen>('landing');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [answers, setAnswers] = useState<Answers>((): Answers => (trade ? { trade } : {}));
  const [i, setI] = useState(0);
  const [cap, setCap] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [biz, setBiz] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<QuizResult | null>(null);
  const [analyzed, setAnalyzed] = useState(0);
  const [locked, setLocked] = useState(false);

  // Pillar answer order, shuffled once per visit so the best answer isn't always first.
  const [order, setOrder] = useState<Record<string, number[]>>({});
  const tracking = useRef<Record<string, string>>({});
  const eventId = useRef('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const fieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid']) {
      const v = params.get(key);
      if (v) tracking.current[key] = v.slice(0, 300);
    }
    if (trade) tracking.current.trade = trade;
    eventId.current = newEventId();
    trackEvent('ViewContent', { content_name: 'Call Flow Score', event_id: `${eventId.current}-view` });
  }, [trade]);

  const go = useCallback((next: Screen) => {
    setError('');
    setScreen(next);
    window.scrollTo({ top: 0 });
  }, []);

  // Each new screen or question moves focus to its heading (or its one field), for keyboard and screen readers.
  useEffect(() => {
    if (screen === 'landing') return;
    const t = window.setTimeout(() => {
      if ((screen === 'name' || screen === 'cap') && fieldRef.current) fieldRef.current.focus();
      else headingRef.current?.focus({ preventScroll: true });
    }, 30);
    return () => window.clearTimeout(t);
  }, [screen, i, cap]);

  const step = STEPS[i];
  const choices: Choice[] =
    step.kind === 'pillar'
      ? (order[step.q.id] ?? step.q.options.map((_, k) => k)).map((k) => ({ value: String(k), label: step.q.options[k].label }))
      : step.q.options.map((o) => ({ value: o.value, label: o.label }));

  const pick = useCallback(
    (value: string) => {
      if (locked) return;
      setLocked(true);
      setAnswers((prev) => ({ ...prev, [step.q.id]: value }));
      window.setTimeout(() => {
        setLocked(false);
        if (i < TOTAL - 1) setI(i + 1);
        else {
          setCap(1);
          go('cap');
        }
      }, reducedMotion() ? 0 : ADVANCE_MS);
    },
    [locked, step, i, go]
  );

  // Number keys 1–9 pick an answer.
  useEffect(() => {
    if (screen !== 'q') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= choices.length) {
        e.preventDefault();
        pick(choices[n - 1].value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, choices, pick]);

  function sendLead(stepName: 'email' | 'complete', extra: Record<string, unknown> = {}) {
    try {
      void fetch('/api/score-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          step: stepName,
          first_name: first.trim(),
          last_name: last.trim(),
          email: email.trim(),
          answers,
          utm: tracking.current,
          event_id: eventId.current,
          company_fax: honeypot,
          ...extra,
        }),
      }).catch(() => {});
    } catch {
      // Never block the results on delivery.
    }
  }

  function start() {
    setOrder((prev) => (Object.keys(prev).length ? prev : Object.fromEntries(QUIZ.pillars.map((p) => [p.id, shuffled(p.options.length)]))));
    go('name');
  }

  function submitName(e: FormEvent) {
    e.preventDefault();
    if (!first.trim()) {
      setError('Add your first name to start.');
      fieldRef.current?.focus();
      return;
    }
    trackEvent('QuizStart', { event_id: `${eventId.current}-start` });
    setI(0);
    go('q');
  }

  function submitCap(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (cap === 1) {
      const v = email.trim();
      if (!EMAIL_RE.test(v)) return fail('Enter an email like name@company.com.');
      sendLead('email', { email: v });
      setCap(2);
      return;
    }
    if (cap === 2) {
      if (biz.trim().length < 2) return fail('Add your business name.');
      setCap(3);
      return;
    }
    const digits = phone.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
    if (digits.length !== 10) return fail('Enter a 10-digit phone number.');
    finish(digits);
  }

  function fail(message: string) {
    setError(message);
    fieldRef.current?.focus();
  }

  function finish(digits: string) {
    const r = computeResult(answers);
    setResult(r);
    sendLead('complete', { business_name: biz.trim(), phone: digits, sms_consent: consent });
    trackEvent('Lead', { content_name: 'Call Flow Score', score: r.score, event_id: `${eventId.current}-lead` });
    if (r.route !== 'nurture') trackEvent('QualifiedLead', { route: r.route, score: r.score, event_id: `${eventId.current}-qualified` });
    go('an');
    setAnalyzed(0);
    const gap = reducedMotion() ? 0 : 450;
    if (!gap) {
      setAnalyzed(3);
      go('res');
      return;
    }
    [1, 2, 3].forEach((k) => window.setTimeout(() => setAnalyzed(k), gap * k));
    window.setTimeout(() => go('res'), gap * 4);
  }

  function back() {
    setError('');
    if (screen === 'name') return go('landing');
    if (screen === 'q') return i === 0 ? go('name') : setI(i - 1);
    if (screen === 'cap') {
      if (cap > 1) return setCap((cap - 1) as 1 | 2);
      setI(TOTAL - 1);
      return go('q');
    }
  }

  function restart() {
    setAnswers(trade ? { trade } : {});
    setI(0);
    setCap(1);
    setEmail('');
    setBiz('');
    setPhone('');
    setConsent(false);
    setResult(null);
    go('landing');
  }

  return (
    <div className="min-h-[100svh]">
      {screen === 'landing' && <Landing trade={trade} onStart={start} />}

      {screen !== 'landing' && screen !== 'res' && (
        <section className="tone-ink min-h-[100svh] gutter pt-28 pb-20 md:pt-36">
          <div className="mx-auto max-w-3xl">
            {screen === 'name' && (
              <>
                <Progress tag="Before we start" pct={4} count={`0/${TOTAL}`} />
                <h1 ref={headingRef} tabIndex={-1} className="display display-md outline-none">First, what should we call you?</h1>
                <p className="lede mt-5 text-[color:var(--tone-muted)]">We use your name to personalize the questions and your plan.</p>
                <form onSubmit={submitName} noValidate className="mt-10">
                  <div className="grid gap-8 sm:grid-cols-2">
                    <Field id="first" label="First name">
                      <input ref={fieldRef} id="first" type="text" autoComplete="given-name" required value={first} onChange={(e) => setFirst(e.target.value)} className={INPUT} aria-invalid={Boolean(error)} aria-describedby={error ? 'form-err' : undefined} />
                    </Field>
                    <Field id="last" label="Last name">
                      <input id="last" type="text" autoComplete="family-name" value={last} onChange={(e) => setLast(e.target.value)} className={INPUT} />
                    </Field>
                  </div>
                  <ErrorLine message={error} />
                  <button type="submit" className="btn btn-solid mt-10">
                    Start my assessment <Arrow dir="right" />
                  </button>
                </form>
                <Foot onBack={back} note={`${TOTAL} quick questions · about 3 minutes`} />
              </>
            )}

            {screen === 'q' && (
              <>
                <Progress tag={step.q.label} pct={Math.round(((i + 1) / (TOTAL + 1)) * 100)} count={`${i + 1}/${TOTAL}`} />
                <h1 ref={headingRef} tabIndex={-1} key={step.q.id} className="display display-sm md:text-[2.75rem] !leading-[1.02] outline-none normal-case tracking-[-0.03em]">
                  {personal(step.q.q, first)}
                </h1>
                {step.q.help && <p className="mt-5 text-base md:text-lg font-medium text-[color:var(--tone-muted)]">{step.q.help}</p>}
                <ul className="mt-10 space-y-3" aria-label="Answers">
                  {choices.map((o, k) => {
                    const selected = answers[step.q.id] === o.value;
                    return (
                      <li key={`${step.q.id}-${o.value}`}>
                        <button
                          type="button"
                          onClick={() => pick(o.value)}
                          aria-pressed={selected}
                          className={`group flex w-full items-center gap-4 rounded-[1.75rem] px-5 py-4 md:px-6 md:py-5 text-left font-semibold text-base md:text-lg leading-snug transition-[background-color,color,box-shadow] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-taam-near-black ${
                            selected
                              ? 'bg-taam-orange text-white shadow-[inset_0_0_0_2px_var(--taam-orange)]'
                              : 'shadow-[inset_0_0_0_2px_rgba(255,255,255,0.22)] hover:shadow-[inset_0_0_0_2px_#fff]'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${selected ? 'bg-white text-taam-orange' : 'bg-white/10 text-white'}`}
                          >
                            {k + 1}
                          </span>
                          <span>{o.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <Foot onBack={back} note="Tip: press a number key to answer" />
              </>
            )}

            {screen === 'cap' && (
              <>
                <p className="eyebrow inline-flex items-center gap-3 text-taam-orange">
                  <span className="h-2 w-2 rounded-full bg-taam-orange" aria-hidden="true" />
                  Questions complete · plan ready
                </p>
                <h1 ref={headingRef} tabIndex={-1} className="display display-md mt-6 outline-none">
                  {personal('{name}, your Call Flow Score is ready.', first)}
                </h1>
                <p className="lede mt-5 text-[color:var(--tone-muted)]">
                  Three quick details and your score, your #1 gap and your 90-day plan open on the next screen.
                </p>
                <ol className="mt-10 flex gap-2" aria-label={`Step ${cap} of 3`}>
                  {['Email', 'Business', 'Phone'].map((label, k) => {
                    const n = k + 1;
                    return (
                      <li
                        key={label}
                        aria-current={n === cap ? 'step' : undefined}
                        className={`eyebrow rounded-full px-4 py-2 ${n === cap ? 'bg-white text-taam-near-black' : n < cap ? 'bg-taam-orange text-white' : 'shadow-[inset_0_0_0_2px_rgba(255,255,255,0.22)] text-[color:var(--tone-muted)]'}`}
                      >
                        {n} {label}
                      </li>
                    );
                  })}
                </ol>
                <form onSubmit={submitCap} noValidate className="mt-10">
                  {/* Honeypot: hidden from people, filled by bots. */}
                  <input type="text" name="company_fax" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} className="hidden" aria-hidden="true" />
                  {cap === 1 && (
                    <Field id="email" label="Where should we send your plan?">
                      <input ref={fieldRef} id="email" type="email" inputMode="email" autoComplete="email" placeholder="you@yourcompany.com" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT} aria-invalid={Boolean(error)} aria-describedby={error ? 'form-err' : undefined} />
                    </Field>
                  )}
                  {cap === 2 && (
                    <Field id="biz" label="What's the name of your business?">
                      <input ref={fieldRef} id="biz" type="text" autoComplete="organization" placeholder="Desert Air HVAC" value={biz} onChange={(e) => setBiz(e.target.value)} className={INPUT} aria-invalid={Boolean(error)} aria-describedby={error ? 'form-err' : undefined} />
                    </Field>
                  )}
                  {cap === 3 && (
                    <>
                      <Field id="phone" label="Best mobile number">
                        <input ref={fieldRef} id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(702) 555-0123" value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT} aria-invalid={Boolean(error)} aria-describedby={error ? 'form-err' : undefined} />
                      </Field>
                      <div className="[&_input]:accent-taam-orange">
                        <SmsConsent id="score-sms" checked={consent} onChange={setConsent} />
                      </div>
                    </>
                  )}
                  <ErrorLine message={error} />
                  <button type="submit" className="btn btn-solid mt-10">
                    {cap === 3 ? 'Show my score' : 'Continue'} <Arrow dir="right" />
                  </button>
                </form>
                <Foot
                  onBack={back}
                  note={
                    <>
                      We never sell or share your details.{' '}
                      <Link href="/privacy" className="underline underline-offset-2 hover:text-white">
                        Privacy policy
                      </Link>
                    </>
                  }
                />
              </>
            )}

            {screen === 'an' && (
              <div aria-live="polite" className="pt-10">
                <h1 ref={headingRef} tabIndex={-1} className="display display-md outline-none">Scoring your answers…</h1>
                <ul className="mt-10 border-t-2 rule">
                  {['Scoring all 7 parts', 'Finding your #1 gap', 'Building your 90-day plan'].map((line, k) => {
                    const done = analyzed > k;
                    return (
                      <li key={line} className={`flex items-center gap-4 border-b-2 rule py-5 text-lg font-bold transition-opacity duration-300 ${done ? 'opacity-100' : 'opacity-40'}`}>
                        <span aria-hidden="true" className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${done ? 'bg-taam-orange' : 'shadow-[inset_0_0_0_2px_rgba(255,255,255,0.3)]'}`}>
                          {done && (
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3.5}>
                              <path d="M5 12.5l4.5 4.5L19 7.5" />
                            </svg>
                          )}
                        </span>
                        {line}
                        <span className="sr-only">{done ? ' done' : ''}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {screen === 'res' && result && (
        <Results r={result} answers={answers} first={first} business={biz.trim()} hotLeadPromise={hotLeadPromise} headingRef={headingRef} onRestart={restart} />
      )}
    </div>
  );
}

const INPUT =
  'w-full px-0 py-3 bg-transparent border-0 border-b-2 border-white/40 focus:border-taam-orange outline-none text-white text-xl md:text-2xl font-semibold placeholder-white/35 transition-colors';

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow block mb-2 text-[color:var(--tone-muted)]">
        {label}
      </label>
      {children}
    </div>
  );
}

function ErrorLine({ message }: { message: string }) {
  return (
    <p id="form-err" role="alert" className={`mt-4 min-h-[1.5rem] text-sm font-bold text-taam-tint-3`}>
      {message}
    </p>
  );
}

function Progress({ tag, pct, count }: { tag: string; pct: number; count: string }) {
  return (
    <div className="mb-10 flex items-center gap-4">
      <span className="eyebrow shrink-0 text-taam-orange">{tag}</span>
      <div className="h-[3px] flex-1 overflow-hidden bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Progress">
        <div className="h-full bg-taam-orange transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ width: `${pct}%` }} />
      </div>
      <span className="eyebrow shrink-0 tabular-nums">{count}</span>
    </div>
  );
}

function Foot({ onBack, note }: { onBack: () => void; note: React.ReactNode }) {
  return (
    <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t-2 rule pt-6">
      <button type="button" onClick={onBack} className="eyebrow link-line py-2">
        ← Back
      </button>
      <span className="text-sm font-medium text-[color:var(--tone-muted)]">{note}</span>
    </div>
  );
}

/* ---------------------------------- Landing ---------------------------------- */

function Landing({ trade, onStart }: { trade: string; onStart: () => void }) {
  const headline = tradeHeadline(trade);
  const at = headline.indexOf("phone");
  const before = at < 0 ? headline : headline.slice(0, at);
  const after = at < 0 ? "" : headline.slice(at + 5);

  return (
    <>
      <section className="tone-orange relative overflow-hidden gutter pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto grid max-w-7xl grid-cols-12 gap-x-6 gap-y-14 items-center">
          <div className="col-span-12 lg:col-span-7">
            <p className="eyebrow">{QUIZ.landing.kicker}</p>
            <h1 className="display display-lg mt-6">
              {before}
              <span className="outline-type">phone</span>
              {after}
            </h1>
            <p className="lede mt-8 max-w-2xl">{QUIZ.landing.sub}</p>
            <div className="mt-10 flex flex-col items-start gap-5">
              <button type="button" onClick={onStart} className="btn btn-solid">
                {QUIZ.landing.button} <Arrow dir="right" />
              </button>
              <p className="max-w-md text-sm font-semibold text-[color:var(--tone-muted)]">{QUIZ.landing.note}</p>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5 relative mt-12 lg:mt-0">
            <Mascot pose="phone" size={220} priority className="absolute -top-20 right-2 w-28 md:-top-24 md:w-44 mascot-bob z-10" />
            <ExampleReport />
          </div>
        </div>
      </section>

      <section className="tone-ink gutter py-16 md:py-24" aria-label="What you get">
        <ol className="mx-auto grid max-w-7xl gap-px overflow-hidden rounded-[var(--radius-card)] bg-white/15 md:grid-cols-3">
          {WHAT_YOU_GET.map(([title, text], k) => (
            <li key={title} className="bg-taam-near-black p-8 md:p-10">
              <span className="eyebrow text-taam-orange">{String(k + 1).padStart(2, '0')}</span>
              <h2 className="display display-sm mt-4">{title}</h2>
              <p className="mt-3 text-base md:text-lg font-medium leading-relaxed text-[color:var(--tone-muted)]">{text}</p>
            </li>
          ))}
        </ol>
        <div className="mx-auto mt-12 flex max-w-7xl justify-center">
          <button type="button" onClick={onStart} className="btn btn-solid">
            {QUIZ.landing.button} <Arrow dir="right" />
          </button>
        </div>
      </section>
    </>
  );
}

function ExampleReport() {
  return (
    <aside aria-label="Example report" className="tone-ink rounded-[var(--radius-card)] p-6 md:p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="eyebrow whitespace-nowrap rounded-full bg-white/10 px-3 py-1.5">Example report</span>
        <span className="eyebrow whitespace-nowrap text-[color:var(--tone-muted)]">Call Flow Score</span>
      </div>
      <div className="mt-6 flex items-end gap-5 border-b-2 rule pb-6">
        <p className="display text-7xl md:text-8xl leading-none">
          41<span className="text-2xl text-[color:var(--tone-muted)]">/100</span>
        </p>
        <p className="pb-2 text-sm font-medium text-[color:var(--tone-muted)]">
          <b className="block text-base font-extrabold text-white">Big gaps</b>
          An example HVAC company, 6–15 people
        </p>
      </div>
      <ul className="mt-5 space-y-2.5">
        {SAMPLE.map(([label, v]) => (
          <li key={label} className="grid grid-cols-[8.5rem_1fr_2rem] items-center gap-3 text-sm font-semibold">
            <span className={v === 20 ? 'text-taam-orange' : ''}>{label}</span>
            <span className="h-2 overflow-hidden rounded-full bg-white/10">
              <span className={`block h-full rounded-full ${v === 20 ? 'bg-taam-orange' : 'bg-white/70'}`} style={{ width: `${v}%` }} />
            </span>
            <span className="text-right tabular-nums">{v}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 rounded-2xl bg-taam-orange p-4 text-sm font-medium leading-relaxed">
        <b className="block font-extrabold">#1 gap: Speed to lead</b>
        Calls go to voicemail after 5 p.m. and come back the next day.
      </p>
    </aside>
  );
}

/* ---------------------------------- Results ---------------------------------- */

function Results({
  r,
  answers,
  first,
  business,
  hotLeadPromise,
  headingRef,
  onRestart,
}: {
  r: QuizResult;
  answers: Answers;
  first: string;
  business: string;
  hotLeadPromise: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  onRestart: () => void;
}) {
  const [shown, setShown] = useState(() => (reducedMotion() ? r.score : 0));
  const [grown, setGrown] = useState(false);
  const [copied, setCopied] = useState('');
  const [fallback, setFallback] = useState('');
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const p = r.weakest;
  const video = C.videos[p.id];
  const book = PLAYBOOK[p.id];
  const said = pillarAnswer(p, answers)?.label ?? '';
  const ctx = { firstName: first, business, trade: answers.trade ?? '' };
  const template = fill(book.template.text, ctx);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setGrown(true));
    if (reducedMotion()) return () => cancelAnimationFrame(raf);
    const t0 = performance.now();
    let id = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 900);
      setShown(Math.round(r.score * (1 - Math.pow(1 - k, 3))));
      if (k < 1) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(id);
    };
  }, [r.score]);

  useEffect(() => {
    if (fallback) boxRef.current?.select();
  }, [fallback]);

  async function copyPlan() {
    const text = planText({ firstName: first, business }, answers, r);
    try {
      await navigator.clipboard.writeText(text);
      setCopied('Copied. Paste it anywhere.');
    } catch {
      setFallback(text);
      setCopied('Select the text below and copy it.');
    }
  }

  const ring = 2 * Math.PI * 44;
  const copyButton = (
    <button type="button" onClick={copyPlan} className="btn btn-ghost">
      Copy my plan
    </button>
  );
  const bookButton = (
    <a href={BOOKING_HREF} className="btn btn-solid">
      {C.bookingLabel} <Arrow dir="right" />
    </a>
  );
  const phoneLink = (
    <a href={C.phoneHref} className="underline underline-offset-2 hover:text-white">
      {C.phoneDisplay}
    </a>
  );

  return (
    <>
      <section className="tone-ink gutter pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="mx-auto grid max-w-7xl grid-cols-12 gap-x-6 gap-y-14">
          <div className="col-span-12 md:col-span-5 lg:col-span-4">
            <div className="relative h-52 w-52 md:h-60 md:w-60" role="img" aria-label={`Call Flow Score ${r.score} out of 100`}>
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="var(--taam-orange)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={ring}
                  strokeDashoffset={grown ? ring * (1 - r.score / 100) : ring}
                  className="transition-[stroke-dashoffset] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                />
              </svg>
              <span className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
                <span className="display text-7xl md:text-8xl tabular-nums">{shown}</span>
                <span className="eyebrow mt-2 text-[color:var(--tone-muted)]">out of 100</span>
              </span>
            </div>
            <p className="display display-sm mt-8 text-taam-orange">{r.tier.label}</p>
            <p className="mt-3 text-lg font-semibold leading-snug">{r.tier.line}</p>
            <p className="mt-4 text-sm font-medium leading-relaxed text-[color:var(--tone-muted)]">{QUIZ.scoreNote}</p>
          </div>

          <div className="col-span-12 md:col-span-7 lg:col-span-7 lg:col-start-6">
            <h1 ref={headingRef} tabIndex={-1} className="display display-md outline-none">
              {personal("{name}, here's where calls slip away.", first)}
            </h1>
            <p className="lede mt-5 text-[color:var(--tone-muted)]">Each part has one next move, picked from the answer you gave.</p>
            <ul className="mt-10 border-t-2 rule">
              {QUIZ.pillars.map((x) => {
                const s = r.pillarScores[x.id];
                const isGap = x.id === p.id;
                const isBest = r.strongest?.id === x.id;
                return (
                  <li key={x.id} className="grid grid-cols-[1fr_auto] md:grid-cols-[13rem_1fr_3rem] items-center gap-x-4 gap-y-2 border-b-2 rule py-4">
                    <span className={`flex flex-wrap items-center gap-2 font-bold ${isGap ? 'text-taam-orange' : ''}`}>
                      {x.label}
                      {isGap && <span className="eyebrow rounded-full bg-taam-orange px-2.5 py-1 text-[0.625rem] text-white">#1 gap</span>}
                      {isBest && <span className="eyebrow rounded-full bg-white px-2.5 py-1 text-[0.625rem] text-taam-near-black">strongest</span>}
                    </span>
                    <span className="order-3 col-span-2 md:order-none md:col-span-1 h-2.5 overflow-hidden rounded-full bg-white/10">
                      <span
                        className={`block h-full rounded-full transition-[width] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${isGap ? 'bg-taam-orange' : 'bg-white/75'}`}
                        style={{ width: grown ? `${s}%` : '0%' }}
                      />
                    </span>
                    <span className="text-right font-extrabold tabular-nums">{s}</span>
                    <span className="order-4 col-span-2 md:col-start-2 text-sm md:text-base font-medium leading-snug text-[color:var(--tone-muted)]">
                      <b className="font-extrabold text-white">Next:</b> {nextStep(x, answers)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="tone-ink gutter pb-16 md:pb-24">
        <article className="tone-orange mx-auto max-w-7xl rounded-[var(--radius-card)] p-7 md:p-14">
          <p className="eyebrow">Your #1 gap · fix this first</p>
          <h2 className="display display-md mt-5">{p.result.headline}</h2>
          {said && (
            <p className="mt-6 max-w-3xl text-lg font-bold leading-snug">
              You told us: &ldquo;{said}&rdquo;
            </p>
          )}
          <p className="lede mt-4 max-w-3xl">{p.result.diagnosis}</p>

          {video && (
            <div className="media-card mt-10 aspect-video max-w-3xl">
              <iframe src={video} title={`${p.label} video`} allow="autoplay; fullscreen" allowFullScreen className="absolute inset-0 h-full w-full" />
            </div>
          )}

          <div className="mt-12 grid gap-10 border-t-2 rule pt-10 md:grid-cols-2">
            <div>
              <h3 className="eyebrow">Do this today · 15 minutes</h3>
              <p className="display display-sm mt-4">{fill(book.today.title, ctx)}</p>
              <ol className="mt-6 space-y-4">
                {book.today.steps.map((step, k) => (
                  <li key={step} className="flex gap-3 text-lg font-semibold leading-snug">
                    <span className="eyebrow pt-1.5 shrink-0">{String(k + 1).padStart(2, '0')}</span>
                    {fill(step, ctx)}
                  </li>
                ))}
              </ol>
            </div>
            <div className="tone-ink rounded-[1.5rem] p-6 md:p-7">
              <h3 className="eyebrow text-taam-orange">Copy and use</h3>
              <p className="display display-sm mt-3">{book.template.title}</p>
              <p className="mt-5 whitespace-pre-wrap rounded-2xl bg-white/[0.07] p-5 text-base font-medium leading-relaxed">{template}</p>
              {book.template.note && <p className="mt-4 text-sm font-medium leading-relaxed text-[color:var(--tone-muted)]">{fill(book.template.note, ctx)}</p>}
              <CopyText text={template} label="Copy this" />
            </div>
          </div>

          <div className="mt-12 grid gap-10 border-t-2 rule pt-10 md:grid-cols-2">
            <div>
              <h3 className="eyebrow">What good looks like</h3>
              <p className="mt-4 text-lg font-semibold leading-relaxed">{p.result.good}</p>
            </div>
            <div>
              <h3 className="eyebrow">Ask yourself this week</h3>
              <ol className="mt-4 space-y-3">
                {p.result.questions.map((q, k) => (
                  <li key={q} className="flex gap-3 text-lg font-semibold leading-snug">
                    <span className="eyebrow pt-1.5 shrink-0">{String(k + 1).padStart(2, '0')}</span>
                    {q}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {p.result.plan.map(([days, title, text], k) => (
              <li key={days} className="tone-ink flex flex-col rounded-[1.5rem] p-6 md:p-7">
                <span className="eyebrow text-taam-orange">{days}</span>
                <h3 className="display display-sm mt-3">{title}</h3>
                <p className="mt-3 mb-6 text-base font-medium leading-relaxed text-[color:var(--tone-muted)]">{text}</p>
                <p className="mt-auto border-t-2 rule pt-4 text-base font-semibold leading-snug">
                  <span className="eyebrow mb-1.5 block text-taam-orange">Done when</span>
                  {book.done[k]}
                </p>
              </li>
            ))}
          </ol>

          <Worth gap={p.label.toLowerCase().replace('google', 'Google')} />

          <p className="mt-10 max-w-3xl text-base font-bold leading-relaxed">{p.result.taam}</p>
        </article>
      </section>

      <section className="tone-ink gutter pb-24 md:pb-32">
        <div className="mx-auto grid max-w-7xl grid-cols-12 gap-x-6 gap-y-8 border-t-2 rule pt-12 md:pt-16 items-start">
          <div className="col-span-12 md:col-span-7">
            {r.route === 'hot' && (
              <>
                <h2 className="display display-md">You&apos;re a fit for a results review.</h2>
                <p className="lede mt-5 text-[color:var(--tone-muted)]">
                  {C.bookingNote}
                  {hotLeadPromise ? ` ${hotLeadPromise}` : ''}
                </p>
              </>
            )}
            {r.route === 'qualified' && (
              <>
                <h2 className="display display-md">Want a second set of eyes on your plan?</h2>
                <p className="lede mt-5 text-[color:var(--tone-muted)]">{C.bookingNote}</p>
              </>
            )}
            {r.route === 'nurture' && (
              <>
                <h2 className="display display-md">Start with Days 1–30 this week.</h2>
                <p className="lede mt-5 text-[color:var(--tone-muted)]">
                  Your plan is right here on this page. Fix your #1 gap first, then retake the score in 90 days.
                </p>
              </>
            )}
          </div>
          <div className="col-span-12 md:col-span-5 flex flex-col items-start gap-4 md:items-end">
            {r.route !== 'nurture' && bookButton}
            {copyButton}
            <span role="status" className="min-h-[1.25rem] text-sm font-bold text-taam-orange">
              {copied}
            </span>
            <span className="text-sm font-semibold text-[color:var(--tone-muted)]">
              {r.route === 'hot' ? <>Prefer to call? {phoneLink}</> : r.route === 'qualified' ? <>Or call {phoneLink}</> : <>Questions? Call TAAM at {phoneLink}</>}
            </span>
          </div>

          {fallback && (
            <textarea
              ref={boxRef}
              readOnly
              value={fallback}
              aria-label="Your plan as text"
              rows={14}
              className="col-span-12 w-full rounded-2xl bg-white/5 p-5 font-mono text-sm leading-relaxed text-white outline-none focus:ring-2 focus:ring-taam-orange"
            />
          )}

          <div className="col-span-12 pt-6">
            <button type="button" onClick={onRestart} className="eyebrow link-line py-2">
              Retake the assessment
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

/** Copies one piece of text, with a select-and-copy fallback when the clipboard is blocked. */
function CopyText({ text, label }: { text: string; label: string }) {
  const [status, setStatus] = useState('');
  const [manual, setManual] = useState(false);
  const boxRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (manual) boxRef.current?.select();
  }, [manual]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus('Copied.');
    } catch {
      setManual(true);
      setStatus('Select the text below and copy it.');
    }
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={copy} className="btn btn-solid">
          {label}
        </button>
        <span role="status" className="text-sm font-bold text-taam-orange">
          {status}
        </span>
      </div>
      {manual && (
        <textarea ref={boxRef} readOnly value={text} aria-label="Text to copy" rows={6} className="mt-4 w-full rounded-2xl bg-white/5 p-4 font-mono text-sm leading-relaxed text-white outline-none focus:ring-2 focus:ring-taam-orange" />
      )}
    </div>
  );
}

/** Their own numbers, not ours: extra booked jobs a month times their average job. */
function Worth({ gap }: { gap: string }) {
  const [jobs, setJobs] = useState('4');
  const [value, setValue] = useState('');
  const n = Number(jobs);
  const v = Number(value.replace(/[^\d.]/g, ''));
  const year = n > 0 && v > 0 ? Math.round(n * v * 12) : 0;
  const input =
    'bg-transparent border-0 border-b-2 border-white/60 focus:border-white outline-none px-1 py-1 text-center text-2xl font-extrabold text-white placeholder-white/50 tabular-nums';

  return (
    <div className="mt-12 border-t-2 rule pt-10">
      <h3 className="eyebrow">What fixing this is worth · your numbers</h3>
      <p className="mt-5 max-w-4xl text-xl md:text-2xl font-semibold leading-relaxed">
        If fixing your {gap} brings in{' '}
        <label>
          <span className="sr-only">Extra booked jobs a month</span>
          <input type="number" inputMode="numeric" min={1} max={200} value={jobs} onChange={(e) => setJobs(e.target.value)} className={`${input} w-20`} />
        </label>{' '}
        more booked jobs a month, at{' '}
        <label className="whitespace-nowrap">
          <span className="sr-only">Your average job in dollars</span>$
          <input type="text" inputMode="decimal" placeholder="850" value={value} onChange={(e) => setValue(e.target.value)} className={`${input} w-28`} />
        </label>{' '}
        a job, that&apos;s
      </p>
      <p className="display display-md mt-4" aria-live="polite">
        {year ? `$${year.toLocaleString('en-US')} a year` : 'Add your average job'}
      </p>
    </div>
  );
}
