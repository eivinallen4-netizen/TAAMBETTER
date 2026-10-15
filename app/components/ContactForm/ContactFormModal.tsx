'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  TrendingDown,
  Smartphone,
  Video,
  Globe,
  BarChart3,
  Rocket,
  HelpCircle,
} from 'lucide-react';
import siteContent from '../../content/siteContent.json';
import {
  BUDGET_OPTIONS,
  CHALLENGE_OPTIONS,
  CHALLENGE_TO_SERVICE,
  INDUSTRY_OPTIONS,
  ROLE_OPTIONS,
  STAGE_OPTIONS,
  TIMELINE_OPTIONS,
  isDisposableEmail,
  isPlausiblePhone,
  scoreLeadFit,
  type LeadFit,
  type QualifierOption,
} from '../../lib/cta';
import type { ContactFormPrefill } from './ContactFormProvider';

type Step = 1 | 2 | 3 | 4 | 'confirmation';
const TOTAL_STEPS = 4;

interface ContactFormModalProps {
  prefill?: ContactFormPrefill;
  onClose: () => void;
}

const iconMap: Record<string, React.ComponentType<{ size: number; className: string }>> = {
  TrendingDown,
  Smartphone,
  Video,
  Globe,
  BarChart3,
  Rocket,
  HelpCircle,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function emailError(email: string): string | null {
  const v = email.trim();
  if (!EMAIL_RE.test(v)) return 'That email doesn’t look right.';
  if (isDisposableEmail(v)) return 'Use an email you actually check — throwaway inboxes get filtered out.';
  return null;
}

const emptyFormState = {
  biggestChallenge: '',
  role: '',
  industry: '',
  businessStage: '',
  budget: '',
  timeline: '',
  name: '',
  email: '',
  phone: '',
  businessName: '',
  website: '',
  message: '',
  // Honeypot: hidden from people, irresistible to form-filling bots.
  companyFax: '',
};

type FormField = keyof typeof emptyFormState;

export default function ContactFormModal({ prefill, onClose }: ContactFormModalProps) {
  // This component is only ever mounted while the form is open (see ContactFormProvider),
  // so a fresh mount is all the "reset on open" behavior we need — no reset effect required.
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState(() => ({
    ...emptyFormState,
    biggestChallenge: prefill?.challenge ?? '',
  }));
  const [dirty, setDirty] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [sourcePage] = useState(() => (typeof window !== 'undefined' ? window.location.pathname : ''));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fit, setFit] = useState<LeadFit>('possible');
  const dialogRef = useRef<HTMLDivElement>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const partialSent = useRef(false);
  const openedAt = useRef(Date.now());

  // Services come from where the visitor clicked (prefill) or are inferred from their challenge.
  const services = prefill?.services?.length
    ? prefill.services
    : CHALLENGE_TO_SERVICE[form.biggestChallenge]
      ? [CHALLENGE_TO_SERVICE[form.biggestChallenge]]
      : [];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        requestClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty]);

  useEffect(() => {
    dialogRef.current?.focus();
    dialogRef.current?.scrollTo({ top: 0 });
  }, [step]);

  function buildPayload(final = false) {
    return {
      biggest_challenge: form.biggestChallenge,
      role: form.role,
      services_interested: services,
      industry: form.industry,
      business_stage: form.businessStage,
      budget: form.budget,
      timeline: form.timeline,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      business_name: form.businessName.trim(),
      website: form.website.trim(),
      message: form.message.trim(),
      source_page: sourcePage,
      company_fax: form.companyFax,
      elapsed_ms: Date.now() - openedAt.current,
      final,
    };
  }

  // Save a partial lead once there's a real email, so an abandoned final step isn't lost.
  function savePartial() {
    if (partialSent.current || emailError(form.email)) return;
    partialSent.current = true;
    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload()),
    }).catch((err) => {
      console.error('Partial submission failed:', err);
    });
  }

  function requestClose() {
    if (dirty && step !== 'confirmation') {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  }

  function discardAndClose() {
    setShowExitConfirm(false);
    onClose();
  }

  function updateField(field: FormField, value: string) {
    setDirty(true);
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function selectChallenge(value: string) {
    updateField('biggestChallenge', value);
    // Single-tap question: move on by itself, with a beat so the selection registers.
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => setStep(2), 280);
  }

  function goNext() {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) setStep(4);
  }

  function goBack() {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!step4Valid || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(true)),
      });
      if (!res.ok) throw new Error('Submission failed');
      const data = await res.json().catch(() => ({}));
      setFit(
        data.lead_fit ??
          scoreLeadFit({ stage: form.businessStage, budget: form.budget, timeline: form.timeline, role: form.role }),
      );
      setStep('confirmation');
    } catch {
      setSubmitError('Something went wrong sending that. Mind trying again?');
    } finally {
      setSubmitting(false);
    }
  }

  const step1Valid = form.biggestChallenge !== '';
  const isVendor = form.role === 'vendor';
  const step2Valid = form.role !== '' && !isVendor && form.industry !== '' && form.businessStage !== '';
  const step3Valid = form.budget !== '' && form.timeline !== '';
  const step4Valid =
    form.name.trim() !== '' &&
    form.businessName.trim() !== '' &&
    emailError(form.email) === null &&
    isPlausiblePhone(form.phone);
  const currentValid = step === 1 ? step1Valid : step === 2 ? step2Valid : step3Valid;

  const stepNumber = step === 'confirmation' ? null : step;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Let's talk — project intake"
      tabIndex={-1}
      className="fixed inset-0 z-[100] tone-orange overflow-y-auto outline-none"
    >
      {/* Header: progress + close */}
      <div className="sticky top-0 z-10 bg-taam-orange border-b-2 border-white/40">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          {stepNumber ? (
            <div className="flex items-center gap-3 flex-1">
              <span className="eyebrow shrink-0">
                Step {stepNumber} of {TOTAL_STEPS}
              </span>
              <div className="flex-1 h-[3px] bg-white/30 overflow-hidden max-w-xs">
                <div
                  className="h-full bg-white transition-all duration-500"
                  style={{ width: `${(stepNumber / TOTAL_STEPS) * 100}%` }}
                />
              </div>
              <span className="eyebrow shrink-0 hidden sm:inline opacity-80">About 2 min</span>
            </div>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close form"
            className="ml-4 shrink-0 hover:opacity-70 transition"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <form className="max-w-3xl mx-auto px-6 py-14 md:py-20" onSubmit={handleSubmit} noValidate>
        {step === 1 && (
          <StepChallenge value={form.biggestChallenge} onSelect={selectChallenge} />
        )}
        {step === 2 && (
          <StepIntro title="Tell us about the business." lede="So we come to the call already knowing your world.">
            <div>
              <OptionGroup
                legend="Who are we talking to?"
                name="role"
                options={ROLE_OPTIONS}
                value={form.role}
                onSelect={(v) => updateField('role', v)}
              />
              {isVendor && (
                <p className="mt-5 rounded-lg bg-taam-near-black px-5 py-4 text-sm font-semibold max-w-xl" role="status">
                  Appreciate it, but this form is only for businesses that want to hire us. We don&apos;t take
                  sales pitches, SEO offers or partnership requests here.
                </p>
              )}
            </div>
            <OptionGroup
              legend="What kind of business is it?"
              name="industry"
              options={INDUSTRY_OPTIONS}
              value={form.industry}
              onSelect={(v) => updateField('industry', v)}
            />
            <OptionGroup
              legend="How long have you been open?"
              name="business_stage"
              options={STAGE_OPTIONS}
              value={form.businessStage}
              onSelect={(v) => updateField('businessStage', v)}
            />
          </StepIntro>
        )}
        {step === 3 && (
          <StepIntro
            title="Where are you at?"
            lede="Real marketing takes a real monthly investment. Give us honest numbers and we'll give you an honest answer — a plan that fits, or a referral to someone who can help."
          >
            <OptionGroup
              legend="What could you put toward marketing each month?"
              name="budget"
              options={BUDGET_OPTIONS}
              value={form.budget}
              onSelect={(v) => updateField('budget', v)}
            />
            <OptionGroup
              legend="When do you want to get moving?"
              name="timeline"
              options={TIMELINE_OPTIONS}
              value={form.timeline}
              onSelect={(v) => updateField('timeline', v)}
            />
          </StepIntro>
        )}
        {step === 4 && (
          <StepContactInfo form={form} onChange={updateField} onEmailBlur={savePartial} submitError={submitError} />
        )}
        {step === 'confirmation' && <Confirmation name={form.name} fit={fit} preLaunch={form.businessStage === 'pre_launch'} onClose={onClose} />}

        {step !== 'confirmation' && (
          <div className="flex items-center justify-between mt-12">
            {step !== 1 ? (
              <button type="button" onClick={goBack} className="eyebrow link-line py-3">
                ← Back
              </button>
            ) : (
              <span />
            )}

            {step === 4 ? (
              <button
                type="submit"
                disabled={!step4Valid || submitting}
                className="btn btn-solid disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                {submitting ? 'Sending…' : <>Send it <span aria-hidden="true">↗</span></>}
              </button>
            ) : (
              <button
                type="button"
                disabled={!currentValid}
                onClick={goNext}
                className="btn btn-solid disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                Next →
              </button>
            )}
          </div>
        )}
      </form>

      {showExitConfirm && (
        <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center px-6">
          <div className="tone-ink rounded-[var(--radius-card)] max-w-sm w-full p-8">
            <h3 className="display display-sm mb-3">Discard your progress?</h3>
            <p className="text-sm text-white/70 mb-6">
              Your answers won&apos;t be saved if you close this now.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 btn btn-ghost justify-center !px-4"
              >
                Keep Going
              </button>
              <button
                type="button"
                onClick={discardAndClose}
                className="flex-1 btn justify-center !px-4 bg-taam-orange text-white hover:bg-white hover:text-taam-near-black"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const pillBase =
  'flex items-center gap-4 rounded-full cursor-pointer transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-white has-[:focus-visible]:outline-offset-4';
const pillOff = 'shadow-[inset_0_0_0_2px_rgba(255,255,255,0.55)] hover:shadow-[inset_0_0_0_2px_#fff]';
const pillOn = 'bg-white text-taam-near-black';

function StepIntro({ title, lede, children }: { title: string; lede: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="display display-md mb-5">{title}</h2>
      <p className="lede mb-12 text-white/85 max-w-xl">{lede}</p>
      <div className="space-y-12">{children}</div>
    </div>
  );
}

function OptionGroup({
  legend,
  name,
  options,
  value,
  onSelect,
}: {
  legend: string;
  name: string;
  options: QualifierOption[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="eyebrow mb-5">{legend}</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <label key={opt.value} className={`${pillBase} px-6 py-4 ${selected ? pillOn : pillOff}`}>
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={selected}
                onChange={() => onSelect(opt.value)}
                className="sr-only"
              />
              <span className="font-semibold">{opt.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function StepChallenge({ value, onSelect }: { value: string; onSelect: (v: string) => void }) {
  return (
    <div>
      <h2 className="display display-md mb-5">What&apos;s holding the business back?</h2>
      <p className="lede mb-10 text-white/85">Pick the one that hurts most.</p>
      <div className="space-y-3" role="radiogroup" aria-label="Biggest challenge">
        {CHALLENGE_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          const Icon = iconMap[opt.icon];
          return (
            <label key={opt.value} className={`${pillBase} px-6 py-4 ${selected ? pillOn : pillOff}`}>
              <input
                type="radio"
                name="biggest_challenge"
                value={opt.value}
                checked={selected}
                onChange={() => onSelect(opt.value)}
                className="sr-only"
              />
              {Icon && <Icon size={24} className="shrink-0" />}
              <span className="font-semibold">{opt.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function StepContactInfo({
  form,
  onChange,
  onEmailBlur,
  submitError,
}: {
  form: typeof emptyFormState;
  onChange: (field: FormField, value: string) => void;
  onEmailBlur: () => void;
  submitError: string | null;
}) {
  const inputClass =
    'w-full px-0 py-3 bg-transparent border-0 border-b-2 border-white/50 focus:border-white outline-none text-white text-xl font-semibold placeholder-white/50 transition';
  const optional = <span className="opacity-70 font-medium normal-case tracking-normal">(optional)</span>;
  // Only flag a field once the visitor has left it, so nobody gets yelled at mid-typing.
  const [touched, setTouched] = useState({ email: false, phone: false });
  const emailMsg = touched.email && form.email.trim() !== '' ? emailError(form.email) : null;
  const phoneMsg =
    touched.phone && form.phone.trim() !== '' && !isPlausiblePhone(form.phone)
      ? 'We call every serious inquiry — we’ll need a real number.'
      : null;
  const fieldError = (msg: string) => <p className="mt-2 text-sm font-semibold text-taam-near-black">{msg}</p>;

  return (
    <div>
      <h2 className="display display-md mb-5">Last step. Where do we reach you?</h2>
      <p className="lede mb-8 text-white/85 max-w-xl">
        A real person on our team reads every one of these. No bots, no sales script.
      </p>
      <ol className="mb-10 grid gap-3 sm:grid-cols-3 text-sm font-semibold">
        {[
          'We look over your answers and your business',
          'We call within 1 business day to set up a short chat',
          'You get a plan that fits — or a referral to someone who can help',
        ].map((item, i) => (
          <li key={item} className="flex gap-3 rounded-[var(--radius-card)] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.4)] p-4">
            <span className="eyebrow shrink-0">{String(i + 1).padStart(2, '0')}</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
      {/* Honeypot — off-screen and skipped by keyboard and screen readers; only bots fill it. */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="cf-company-fax">Company fax</label>
        <input
          id="cf-company-fax"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.companyFax}
          onChange={(e) => onChange('companyFax', e.target.value)}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
        <div>
          <label className="block eyebrow mb-2" htmlFor="cf-name">Your name</label>
          <input
            id="cf-name"
            type="text"
            autoComplete="name"
            required
            value={form.name}
            onChange={(e) => onChange('name', e.target.value)}
            className={inputClass}
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label className="block eyebrow mb-2" htmlFor="cf-business">Business name</label>
          <input
            id="cf-business"
            type="text"
            autoComplete="organization"
            required
            value={form.businessName}
            onChange={(e) => onChange('businessName', e.target.value)}
            className={inputClass}
            placeholder="Your Business"
          />
        </div>
        <div>
          <label className="block eyebrow mb-2" htmlFor="cf-email">Email</label>
          <input
            id="cf-email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => onChange('email', e.target.value)}
            onBlur={() => {
              setTouched((t) => ({ ...t, email: true }));
              onEmailBlur();
            }}
            aria-invalid={emailMsg ? true : undefined}
            className={inputClass}
            placeholder="jane@business.com"
          />
          {emailMsg && fieldError(emailMsg)}
        </div>
        <div>
          <label className="block eyebrow mb-2" htmlFor="cf-phone">Phone</label>
          <input
            id="cf-phone"
            type="tel"
            autoComplete="tel"
            required
            value={form.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            aria-invalid={phoneMsg ? true : undefined}
            className={inputClass}
            placeholder="(555) 123-4567"
          />
          {phoneMsg && fieldError(phoneMsg)}
        </div>
        <div className="sm:col-span-2">
          <label className="block eyebrow mb-2" htmlFor="cf-website">Website or Instagram {optional}</label>
          <input
            id="cf-website"
            type="text"
            autoComplete="url"
            value={form.website}
            onChange={(e) => onChange('website', e.target.value)}
            className={inputClass}
            placeholder="yourbusiness.com or @yourbusiness"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block eyebrow mb-2" htmlFor="cf-message">
            What would a big year look like for you? {optional}
          </label>
          <textarea
            id="cf-message"
            rows={2}
            value={form.message}
            onChange={(e) => onChange('message', e.target.value)}
            className={`${inputClass} resize-none text-lg`}
            placeholder="More booked jobs, a second location, a website you're proud of…"
          />
        </div>
      </div>
      <p className="mt-8 text-sm text-white/80">
        No spam, no newsletter sign-up. Your info goes to our team and nowhere else.
      </p>
      {submitError && <p className="mt-4 inline-block rounded-lg bg-taam-near-black px-4 py-3 text-sm font-semibold">{submitError}</p>}
    </div>
  );
}

function Confirmation({
  name,
  fit,
  preLaunch,
  onClose,
}: {
  name: string;
  fit: LeadFit;
  preLaunch: boolean;
  onClose: () => void;
}) {
  const instagram = siteContent.contact.social.instagram;
  const firstName = name.trim().split(/\s+/)[0] || 'friend';

  if (fit === 'early') {
    return (
      <div className="text-center py-10">
        <h2 className="display display-lg mb-6">Thanks, {firstName}.</h2>
        <p className="lede max-w-xl mx-auto mb-6">
          Straight talk: based on your answers, a monthly marketing retainer probably isn&apos;t the best use of
          your money just yet. We&apos;ll still read what you sent.
        </p>
        {preLaunch ? (
          <>
            <p className="lede max-w-xl mx-auto mb-10">
              In the meantime, our free tools are a good place to start while you get the doors open.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/tools" onClick={onClose} className="btn btn-solid">
                Try our free tools →
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="lede max-w-xl mx-auto mb-10">
              In the meantime, since you&apos;re already open and selling, you qualify for a free week of video:
              real content for your business, no retainer.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/free-video-offer" onClick={onClose} className="btn btn-solid">
                Get a free week of video →
              </Link>
              <Link href="/tools" onClick={onClose} className="eyebrow link-line">
                Or try our free tools
              </Link>
            </div>
          </>
        )}
        <CloseLink onClose={onClose} />
      </div>
    );
  }

  return (
    <div className="text-center py-10">
      <h2 className="display display-lg mb-6">Got it, {firstName}.</h2>
      <p className="lede max-w-xl mx-auto mb-10">
        We&apos;ll look over your answers and reach out within 1 business day to set up a short call. If we&apos;re
        not the right team for it, we&apos;ll tell you straight.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/work" onClick={onClose} className="btn btn-solid">
          See our recent work →
        </Link>
        {instagram && (
          <a href={instagram} target="_blank" rel="noopener noreferrer" className="eyebrow link-line">
            Follow us on Instagram
          </a>
        )}
      </div>
      <CloseLink onClose={onClose} />
    </div>
  );
}

function CloseLink({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="block mx-auto mt-8 eyebrow opacity-80 hover:opacity-100 transition"
    >
      Close
    </button>
  );
}
