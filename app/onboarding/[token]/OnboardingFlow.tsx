'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LoaderCircle, Lock, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import Logo from '@/components/editorial/Logo';
import {
  REVIEW_PLATFORMS,
  SOCIAL_PLATFORMS,
  WEBSITE_PASSWORD_KEY,
  WEBSITE_PLATFORMS,
  emptyAnswers,
  platformLabel,
  stepsFor,
  type OnboardingAnswers,
  type OnboardingKind,
  type PasswordMap,
  type ReviewLink,
  type ServiceItem,
  type SocialLogin,
  type SocialPlatform,
  type StepKey,
} from '@/app/lib/onboarding';

interface LoadedOnboarding {
  kind: OnboardingKind;
  clientName: string;
  businessName: string;
  message: string;
  submitted: boolean;
  step: number;
  answers: OnboardingAnswers | null;
  savedPasswords: string[];
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function OnboardingFlow({ token }: { token: string }) {
  const [state, setState] = useState<'loading' | 'missing' | 'ready' | 'done'>('loading');
  const [info, setInfo] = useState({ clientName: '', businessName: '', message: '' });
  const [kind, setKind] = useState<OnboardingKind>('full');
  const [answers, setAnswers] = useState<OnboardingAnswers>(emptyAnswers());
  const [passwords, setPasswords] = useState<PasswordMap>({});
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/onboarding/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return setState('missing');
        const data: LoadedOnboarding = await res.json();
        setInfo({ clientName: data.clientName, businessName: data.businessName, message: data.message });
        setKind(data.kind ?? 'full');
        if (data.submitted) return setState('done');
        if (data.answers) setAnswers(data.answers);
        setSaved(new Set(data.savedPasswords));
        setStep(data.step);
        setFurthest(data.step);
        setState('ready');
      })
      .catch(() => setState('missing'));
  }, [token]);

  const firstName = (answers.business.contactName || info.clientName).trim().split(/\s+/)[0] || 'there';
  const business = answers.business.businessName || info.businessName || 'your business';
  const steps = stepsFor(kind);
  const LAST_STEP = steps.length - 1;
  const current: StepKey = steps[Math.min(step, LAST_STEP)].key;
  const indexOf = (key: StepKey) => steps.findIndex((s) => s.key === key);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  async function save(nextStep: number, submit = false) {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/onboarding/${encodeURIComponent(token)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, passwords, step: nextStep, submit }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save. Please try again.');
      setSaved(new Set(data.savedPasswords as string[]));
      setPasswords({});
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  function stepError(): string {
    if (current === 'business') {
      const b = answers.business;
      if (!b.businessName.trim()) return 'Add your business name.';
      if (!b.contactName.trim()) return 'Add your name.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email.trim())) return 'Add an email we can reach you at.';
    }
    return '';
  }

  async function goTo(next: number) {
    if (next > step) {
      const problem = stepError();
      if (problem) return setError(problem);
    }
    if (await save(next)) {
      setStep(next);
      setFurthest((f) => Math.max(f, next));
    }
  }

  async function submit() {
    if (await save(LAST_STEP, true)) setState('done');
  }

  if (state === 'loading') {
    return (
      <Shell>
        <div className="flex min-h-[60vh] items-center justify-center text-white/50">
          <LoaderCircle className="h-6 w-6 animate-spin" />
        </div>
      </Shell>
    );
  }

  if (state === 'missing') {
    return (
      <Shell>
        <div className="mx-auto max-w-xl py-24 text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight md:text-5xl">Link not found</h1>
          <p className="mt-4 text-white/60">This onboarding link isn&apos;t valid anymore. Reach out to the TAAM team and we&apos;ll send you a fresh one.</p>
        </div>
      </Shell>
    );
  }

  if (state === 'done') {
    return (
      <Shell>
        <div className="mx-auto max-w-2xl py-20 text-center md:py-28">
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-taam-orange">
            <Check className="h-8 w-8" strokeWidth={3} />
          </div>
          <h1 className="text-5xl font-black uppercase leading-[0.95] tracking-tight md:text-7xl">
            Thank you,
            <br />
            {firstName}.
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg text-white/70">
            We&apos;ve got everything we need for your {kind === 'website' ? 'website' : kind === 'social' ? 'social media' : 'onboarding'}. The team is reviewing it now and we&apos;ll reach out within one business day with next steps.
          </p>
          <p className="mt-10 text-sm uppercase tracking-[0.2em] text-white/40">Better marketing for the best businesses.</p>
        </div>
      </Shell>
    );
  }

  const update = <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => setAnswers((a) => ({ ...a, [key]: value }));

  return (
    <Shell>
      <Progress steps={steps} kind={kind} step={step} furthest={furthest} onJump={(i) => i !== step && goTo(i)} clientName={info.clientName} disabled={saving} />

      <div className="mx-auto max-w-3xl pb-32 pt-10 md:pt-14">
        {current === 'welcome' && <WelcomeStep kind={kind} firstName={firstName} business={business} message={info.message} />}
        {current === 'business' && <BusinessStep firstName={firstName} value={answers.business} onChange={(v) => update('business', v)} />}
        {current === 'social' && (
          <SocialStep
            firstName={firstName}
            value={answers.social}
            onChange={(v) => update('social', v)}
            passwords={passwords}
            saved={saved}
            onPassword={(id, pw) => setPasswords((p) => ({ ...p, [id]: pw }))}
          />
        )}
        {current === 'website' && (
          <WebsiteStep
            business={business}
            value={answers.website}
            onChange={(v) => update('website', v)}
            password={passwords[WEBSITE_PASSWORD_KEY] ?? ''}
            hasSaved={saved.has(WEBSITE_PASSWORD_KEY)}
            onPassword={(pw) => setPasswords((p) => ({ ...p, [WEBSITE_PASSWORD_KEY]: pw }))}
          />
        )}
        {current === 'services' && <ServicesStep firstName={firstName} value={answers.services} onChange={(v) => update('services', v)} />}
        {current === 'reviews' && <ReviewsStep kind={kind} business={business} value={answers.reviews} onChange={(v) => update('reviews', v)} />}
        {current === 'review' && (
          <ReviewStep kind={kind} firstName={firstName} answers={answers} saved={saved} pending={passwords} onEdit={(key) => goTo(indexOf(key))} />
        )}
      </div>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-taam-near-black/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 py-4 md:px-0">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-bold uppercase tracking-wider text-white/80 transition hover:border-white hover:text-white disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <span />
          )}

          <div className="flex-1 text-sm text-red-400" role="alert">
            {error}
          </div>

          {step > 0 && step < LAST_STEP && (
            <button
              type="button"
              onClick={() => save(step).then((ok) => ok && setError(''))}
              disabled={saving}
              className="hidden text-sm font-semibold text-white/50 underline-offset-4 hover:text-white hover:underline sm:inline"
            >
              Save &amp; finish later
            </button>
          )}

          {step < LAST_STEP ? (
            <button
              type="button"
              onClick={() => goTo(step + 1)}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-taam-orange px-6 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-taam-tint-2 disabled:opacity-60"
            >
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {step === 0 ? "Let's go" : 'Next'} <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-taam-orange px-6 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:bg-taam-tint-2 disabled:opacity-60"
            >
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Submit everything
            </button>
          )}
        </div>
      </div>
    </Shell>
  );
}

/* ---------------------------------------------------------------- layout */

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-taam-near-black px-4 text-white md:px-8">
      <header className="mx-auto flex max-w-3xl items-center justify-between py-6">
        <Logo className="h-5" />
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
          <Lock className="h-3.5 w-3.5" /> Private &amp; encrypted
        </span>
      </header>
      {children}
    </div>
  );
}

function Progress({
  steps,
  kind,
  step,
  furthest,
  onJump,
  clientName,
  disabled,
}: {
  steps: { key: StepKey; label: string }[];
  kind: OnboardingKind;
  step: number;
  furthest: number;
  onJump: (i: number) => void;
  clientName: string;
  disabled: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-baseline justify-between text-xs font-bold uppercase tracking-[0.18em]">
        <span className="text-taam-orange">
          {clientName}&apos;s {kind === 'website' ? 'website ' : kind === 'social' ? 'social media ' : ''}onboarding
        </span>
        <span className="text-white/40">
          Step {step + 1} of {steps.length}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-taam-orange transition-[width] duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-4 hidden gap-1 md:flex">
        {steps.map((s, i) => {
          const reachable = i <= furthest && !disabled;
          return (
            <li key={s.key} className="flex-1">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onJump(i)}
                className={`w-full truncate text-left text-[11px] font-semibold uppercase tracking-wider transition ${
                  i === step ? 'text-white' : reachable ? 'text-white/50 hover:text-white' : 'text-white/20'
                }`}
              >
                {i < step || (i <= furthest && i !== step) ? '✓ ' : ''}
                {s.label}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepHead({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-10">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-taam-orange">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-black uppercase leading-[0.95] tracking-tight md:text-6xl">{title}</h1>
      {children && <div className="mt-5 max-w-2xl text-lg text-white/65">{children}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------- fields */

const inputClass =
  'w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-white/30 outline-none transition focus:border-taam-orange focus:bg-white/[0.07]';

function Field({ label, hint, children, wide }: { label: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? 'md:col-span-2' : ''}`}>
      <span className="mb-2 block text-sm font-bold text-white/85">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-white/40">{hint}</span>}
    </label>
  );
}

function Text({
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete = 'off',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} className={inputClass} />;
}

function Area({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={`${inputClass} resize-y`} />;
}

function Password({ value, onChange, hasSaved }: { value: string; onChange: (v: string) => void; hasSaved: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={hasSaved ? 'Saved ✓  (type to replace)' : 'Password'}
        autoComplete="new-password"
        className={`${inputClass} pr-12 ${hasSaved && !value ? 'placeholder:text-emerald-400/80' : ''}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2">{children}</div>;
}

/* ---------------------------------------------------------------- steps */

const CHECKLIST: Partial<Record<StepKey, string>> = {
  business: 'The basics and the best way to reach you.',
  social: 'Each account we’ll run, organized by platform.',
  website: 'Your current site, links, and the login if you have one.',
  services: 'The services and products you sell.',
  reviews: 'Links to your reviews so we can feature them.',
};

function WelcomeStep({ kind, firstName, business, message }: { kind: OnboardingKind; firstName: string; business: string; message: string }) {
  const checklist = stepsFor(kind)
    .filter((s) => CHECKLIST[s.key])
    .map((s) => [s.label, CHECKLIST[s.key]!]);
  const focus = kind === 'website' ? 'a website that' : kind === 'social' ? 'social media that' : 'marketing that';
  return (
    <>
      <StepHead
        eyebrow="You're in · Welcome to TAAM"
        title={
          <>
            Welcome,
            <br />
            <span className="text-taam-orange">{firstName}.</span>
          </>
        }
      >
        You&apos;re officially a TAAM client. Thanks for trusting us. We can&apos;t make you good at what you do. You already did that. Our job is to build {focus} shows {business} to the people who need to see it. This is the last step before we start, and it only takes a few minutes.
      </StepHead>

      {message && (
        <div className="mb-10 rounded-2xl border-l-4 border-taam-orange bg-white/[0.04] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">A note from the team</p>
          <p className="mt-3 whitespace-pre-line text-lg leading-relaxed text-white/85">{message}</p>
        </div>
      )}

      <ol className="divide-y divide-white/10 rounded-2xl border border-white/10">
        {checklist.map(([title, body], i) => (
          <li key={title} className="flex gap-5 p-5">
            <span className="text-2xl font-black text-taam-orange">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <p className="font-bold">{title}</p>
              <p className="text-sm text-white/55">{body}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-6 flex items-start gap-2 text-sm text-white/50">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        Your progress saves every time you hit Next. You can close this page and come back with the same link.
      </p>
    </>
  );
}

function BusinessStep({
  firstName,
  value,
  onChange,
}: {
  firstName: string;
  value: OnboardingAnswers['business'];
  onChange: (v: OnboardingAnswers['business']) => void;
}) {
  const set = (k: keyof typeof value) => (v: string) => onChange({ ...value, [k]: v });
  return (
    <>
      <StepHead eyebrow="Your business" title={<>Let&apos;s start with you, {firstName}.</>}>
        How to reach you. Starred fields are required.
      </StepHead>
      <Grid>
        <Field label="Business name *">
          <Text value={value.businessName} onChange={set('businessName')} autoComplete="organization" />
        </Field>
        <Field label="Your name *">
          <Text value={value.contactName} onChange={set('contactName')} autoComplete="name" />
        </Field>
        <Field label="Email *">
          <Text type="email" value={value.email} onChange={set('email')} autoComplete="email" />
        </Field>
        <Field label="Phone">
          <Text type="tel" value={value.phone} onChange={set('phone')} autoComplete="tel" />
        </Field>
        <Field label="Best way to reach you">
          <select value={value.bestContact} onChange={(e) => set('bestContact')(e.target.value)} className={inputClass}>
            <option value="">Choose one</option>
            <option>Text</option>
            <option>Phone call</option>
            <option>Email</option>
          </select>
        </Field>
        <Field label="Industry">
          <Text value={value.industry} onChange={set('industry')} placeholder="e.g. Restaurant, dental, roofing" />
        </Field>
      </Grid>
    </>
  );
}

function SocialStep({
  firstName,
  value,
  onChange,
  passwords,
  saved,
  onPassword,
}: {
  firstName: string;
  value: SocialLogin[];
  onChange: (v: SocialLogin[]) => void;
  passwords: PasswordMap;
  saved: Set<string>;
  onPassword: (id: string, pw: string) => void;
}) {
  const add = (platform: SocialPlatform) =>
    onChange([...value, { id: uid(), platform, label: '', handle: '', login: '', twoFactor: '', notes: '' }]);
  const patch = (id: string, changes: Partial<SocialLogin>) => onChange(value.map((s) => (s.id === id ? { ...s, ...changes } : s)));
  const remove = (id: string) => onChange(value.filter((s) => s.id !== id));

  return (
    <>
      <StepHead eyebrow="Social logins" title={<>Your social accounts.</>}>
        {firstName}, add every account you want us to run. Tap a platform to add it. Passwords are encrypted and only the TAAM team can see them.
      </StepHead>

      <div className="mb-8 flex flex-wrap gap-2">
        {SOCIAL_PLATFORMS.map((p) => {
          const count = value.filter((s) => s.platform === p.key).length;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => add(p.key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                count ? 'border-taam-orange bg-taam-orange/15 text-white' : 'border-white/20 text-white/75 hover:border-white hover:text-white'
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              {p.label}
              {count > 0 && <span className="ml-1 rounded-full bg-taam-orange px-1.5 text-xs font-black">{count}</span>}
            </button>
          );
        })}
      </div>

      {value.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/45">
          No accounts added yet. Pick a platform above to start. If you don&apos;t have social accounts yet, just hit Next.
        </div>
      ) : (
        <div className="space-y-5">
          {value.map((s) => (
            <div key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tight">{platformLabel(s)}</h3>
                <button
                  type="button"
                  onClick={() => remove(s.id)}
                  className="inline-flex items-center gap-1 text-sm text-white/40 hover:text-red-400"
                  aria-label={`Remove ${platformLabel(s)}`}
                >
                  <Trash2 className="h-4 w-4" /> Remove
                </button>
              </div>
              <Grid>
                {s.platform === 'other' && (
                  <Field label="Platform name" wide>
                    <Text value={s.label} onChange={(v) => patch(s.id, { label: v })} placeholder="e.g. Yelp, Nextdoor, Threads" />
                  </Field>
                )}
                <Field label="Profile link or @handle" wide>
                  <Text value={s.handle} onChange={(v) => patch(s.id, { handle: v })} placeholder="@yourbusiness or https://…" />
                </Field>
                <Field label="Login email / username">
                  <Text value={s.login} onChange={(v) => patch(s.id, { login: v })} />
                </Field>
                <Field label="Password">
                  <Password value={passwords[s.id] ?? ''} onChange={(v) => onPassword(s.id, v)} hasSaved={saved.has(s.id)} />
                </Field>
                <Field label="Two-factor codes go to…" hint="So we know who to text when a login code is sent.">
                  <Text value={s.twoFactor} onChange={(v) => patch(s.id, { twoFactor: v })} placeholder="e.g. my cell 555-123-4567" />
                </Field>
                <Field label="Notes">
                  <Text value={s.notes} onChange={(v) => patch(s.id, { notes: v })} placeholder="Anything we should know" />
                </Field>
              </Grid>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function WebsiteStep({
  business,
  value,
  onChange,
  password,
  hasSaved,
  onPassword,
}: {
  business: string;
  value: OnboardingAnswers['website'];
  onChange: (v: OnboardingAnswers['website']) => void;
  password: string;
  hasSaved: boolean;
  onPassword: (v: string) => void;
}) {
  const set = (k: keyof typeof value) => (v: string) => onChange({ ...value, [k]: v });
  const noSite = value.platform === 'No website yet';
  return (
    <>
      <StepHead eyebrow="Website" title={<>{business}&apos;s website.</>}>
        Your current site and every link you send customers to.
      </StepHead>

      <Grid>
        <Field label="Current website link">
          <Text type="url" value={value.currentUrl} onChange={set('currentUrl')} placeholder="https://yourbusiness.com" />
        </Field>
        <Field label="What's it built on?">
          <select value={value.platform} onChange={(e) => set('platform')(e.target.value)} className={inputClass}>
            <option value="">Not sure</option>
            {WEBSITE_PLATFORMS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Other links" hint="One per line: booking page, Linktree, Google listing, online store, menu…" wide>
          <Area value={value.otherLinks} onChange={set('otherLinks')} rows={4} placeholder={'https://calendly.com/…\nhttps://linktr.ee/…'} />
        </Field>
      </Grid>

      {!noSite && (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5 md:p-6">
          <h3 className="mb-1 text-xl font-black uppercase tracking-tight">Website login</h3>
          <p className="mb-5 text-sm text-white/50">Only if you want us to work on the site. Skip anything you don&apos;t know.</p>
          <Grid>
            <Field label="Admin / login page" wide>
              <Text value={value.adminUrl} onChange={set('adminUrl')} placeholder="e.g. yourbusiness.com/wp-admin or wix.com" />
            </Field>
            <Field label="Login email / username">
              <Text value={value.login} onChange={set('login')} />
            </Field>
            <Field label="Password">
              <Password value={password} onChange={onPassword} hasSaved={hasSaved} />
            </Field>
            <Field label="Where did you buy the domain?" hint="GoDaddy, Google Domains, Namecheap… or not sure." wide>
              <Text value={value.domainProvider} onChange={set('domainProvider')} />
            </Field>
          </Grid>
        </div>
      )}
    </>
  );
}

function ServicesStep({
  firstName,
  value,
  onChange,
}: {
  firstName: string;
  value: OnboardingAnswers['services'];
  onChange: (v: OnboardingAnswers['services']) => void;
}) {
  const items: ServiceItem[] = value.items.length ? value.items : [{ id: 'first', name: '', details: '', price: '' }];
  const setItems = (next: ServiceItem[]) => onChange({ ...value, items: next });
  const patch = (id: string, changes: Partial<ServiceItem>) => setItems(items.map((it) => (it.id === id ? { ...it, ...changes } : it)));

  return (
    <>
      <StepHead eyebrow="What you offer" title={<>What do you sell?</>}>
        {firstName}, list your services and products, one per row. Add a price if you want it shown.
      </StepHead>

      <div className="space-y-4">
        {items.map((it, i) => (
          <div key={it.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-black uppercase tracking-wider text-taam-orange">Service {i + 1}</span>
              {items.length > 1 && (
                <button type="button" onClick={() => setItems(items.filter((x) => x.id !== it.id))} className="text-white/40 hover:text-red-400" aria-label="Remove service">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
              <Text value={it.name} onChange={(v) => patch(it.id, { name: v })} placeholder="Name, e.g. Full detail" />
              <Text value={it.price} onChange={(v) => patch(it.id, { price: v })} placeholder="Price (optional)" />
              <div className="md:col-span-2">
                <Text value={it.details} onChange={(v) => patch(it.id, { details: v })} placeholder="Short description (optional)" />
              </div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItems([...items, { id: uid(), name: '', details: '', price: '' }])}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white/80 hover:border-white hover:text-white"
        >
          <Plus className="h-4 w-4" /> Add another service
        </button>
      </div>

      <div className="mt-10">
        <Field label="Anything else about what you offer?" hint="Packages, menus, service areas, links to price lists…" wide>
          <Area value={value.notes} onChange={(v) => onChange({ ...value, items, notes: v })} rows={4} />
        </Field>
      </div>
    </>
  );
}

function ReviewsStep({
  kind,
  business,
  value,
  onChange,
}: {
  kind: OnboardingKind;
  business: string;
  value: OnboardingAnswers['reviews'];
  onChange: (v: OnboardingAnswers['reviews']) => void;
}) {
  const links: ReviewLink[] = value.links.length ? value.links : [{ id: 'first', platform: 'Google', url: '' }];
  const setLinks = (next: ReviewLink[]) => onChange({ ...value, links: next });
  const patch = (id: string, changes: Partial<ReviewLink>) => setLinks(links.map((l) => (l.id === id ? { ...l, ...changes } : l)));

  return (
    <>
      <StepHead eyebrow="Reviews" title={<>Where are your reviews?</>}>
        Links to {business}&apos;s reviews on Google, Yelp, Facebook or anywhere else. We&apos;ll feature the best ones {kind === 'social' ? 'in your posts' : 'on your website'}.
      </StepHead>

      <div className="space-y-4">
        {links.map((l) => (
          <div key={l.id} className="grid items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 md:grid-cols-[11rem_1fr_2.5rem]">
            <select value={l.platform} onChange={(e) => patch(l.id, { platform: e.target.value })} className={inputClass} aria-label="Review site">
              {REVIEW_PLATFORMS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <Text type="url" value={l.url} onChange={(v) => patch(l.id, { url: v })} placeholder="https://…" />
            {links.length > 1 && (
              <button type="button" onClick={() => setLinks(links.filter((x) => x.id !== l.id))} className="justify-self-end p-2 text-white/40 hover:text-red-400" aria-label="Remove link">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLinks([...links, { id: uid(), platform: 'Google', url: '' }])}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-bold text-white/80 hover:border-white hover:text-white"
        >
          <Plus className="h-4 w-4" /> Add another link
        </button>
      </div>

      <div className="mt-10">
        <Field label="Favorite reviews (optional)" hint="Paste any reviews you especially want us to use." wide>
          <Area value={value.favorites} onChange={(v) => onChange({ ...value, links, favorites: v })} rows={5} />
        </Field>
      </div>
    </>
  );
}

function ReviewStep({
  kind,
  firstName,
  answers,
  saved,
  pending,
  onEdit,
}: {
  kind: OnboardingKind;
  firstName: string;
  answers: OnboardingAnswers;
  saved: Set<string>;
  pending: PasswordMap;
  onEdit: (step: StepKey) => void;
}) {
  const has = (key: StepKey) => stepsFor(kind).some((s) => s.key === key);
  const hasPw = (key: string) => saved.has(key) || Boolean(pending[key]);
  const b = answers.business;
  const w = answers.website;
  const services = answers.services.items.filter((it) => it.name.trim());
  const reviews = answers.reviews.links.filter((l) => l.url.trim());

  const summary = [
    {
      step: 'business' as StepKey,
      title: 'Your business',
      rows: [
        ['Business', b.businessName],
        ['Name', b.contactName],
        ['Email', b.email],
        ['Phone', b.phone],
        ['Best contact', b.bestContact],
        ['Industry', b.industry],
      ],
    },
    {
      step: 'website' as StepKey,
      title: 'Website',
      rows: [
        ['Current site', w.currentUrl],
        ['Built on', w.platform],
        ['Other links', w.otherLinks],
        ['Login', w.login ? `${w.login} · ${hasPw(WEBSITE_PASSWORD_KEY) ? 'password saved' : 'no password'}` : ''],
      ],
    },
  ].filter((s) => has(s.step));

  return (
    <>
      <StepHead eyebrow="Review" title={<>Look good, {firstName}?</>}>
        Check everything below. Tap Edit to change anything, then hit Submit.
      </StepHead>

      <div className="space-y-5">
        {summary.slice(0, 1).map((s) => (
          <ReviewCard key={s.title} title={s.title} onEdit={() => onEdit(s.step)} rows={s.rows} />
        ))}

        {has('social') && (
        <div className="rounded-2xl border border-white/10 p-5 md:p-6">
          <ReviewHeader title={`Social accounts (${answers.social.length})`} onEdit={() => onEdit('social')} />
          {answers.social.length === 0 ? (
            <p className="text-white/40">None added.</p>
          ) : (
            <ul className="divide-y divide-white/10">
              {answers.social.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span className="font-bold">{platformLabel(s)}</span>
                  <span className="text-sm text-white/60">{s.handle || s.login || '—'}</span>
                  <span className={`text-xs font-bold uppercase tracking-wider ${hasPw(s.id) ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {hasPw(s.id) ? '✓ Password saved' : 'No password'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        )}

        {summary.slice(1).map((s) => (
          <ReviewCard key={s.title} title={s.title} onEdit={() => onEdit(s.step)} rows={s.rows} />
        ))}

        <div className="rounded-2xl border border-white/10 p-5 md:p-6">
          <ReviewHeader title={`What you offer (${services.length})`} onEdit={() => onEdit('services')} />
          {services.length === 0 ? (
            <p className="text-white/40">None added.</p>
          ) : (
            <ul className="space-y-2">
              {services.map((it) => (
                <li key={it.id} className="text-sm">
                  <span className="font-semibold text-white">{it.name}</span>
                  {it.price && <span className="text-taam-orange"> · {it.price}</span>}
                  {it.details && <span className="text-white/50"> — {it.details}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 p-5 md:p-6">
          <ReviewHeader title={`Review links (${reviews.length})`} onEdit={() => onEdit('reviews')} />
          {reviews.length === 0 ? (
            <p className="text-white/40">None added.</p>
          ) : (
            <ul className="space-y-2">
              {reviews.map((l) => (
                <li key={l.id} className="break-all text-sm">
                  <span className="font-semibold text-white">{l.platform}</span>
                  <span className="text-white/50"> — {l.url}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function ReviewHeader({ title, onEdit }: { title: string; onEdit: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-lg font-black uppercase tracking-tight">{title}</h3>
      <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-sm font-semibold text-taam-orange hover:underline">
        <Pencil className="h-3.5 w-3.5" /> Edit
      </button>
    </div>
  );
}

function ReviewCard({ title, rows, onEdit }: { title: string; rows: string[][]; onEdit: () => void }) {
  const filled = rows.filter(([, v]) => v && v.trim());
  return (
    <div className="rounded-2xl border border-white/10 p-5 md:p-6">
      <ReviewHeader title={title} onEdit={onEdit} />
      {filled.length === 0 ? (
        <p className="text-white/40">Nothing added.</p>
      ) : (
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
          {filled.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-white/45">{k}</dt>
              <dd className="whitespace-pre-line break-words text-white/90">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
