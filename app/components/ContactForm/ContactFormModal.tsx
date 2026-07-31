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
  CHALLENGE_OPTIONS,
  CHALLENGE_TO_SERVICE,
  SERVICE_OPTIONS,
} from '../../lib/cta';
import type { ContactFormPrefill } from './ContactFormProvider';

type Step = 1 | 2 | 3 | 'confirmation';

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

function isValidPhone(phone: string) {
  return phone.replace(/\D/g, '').length >= 10;
}

const emptyFormState = {
  biggestChallenge: '',
  services: [] as string[],
  name: '',
  email: '',
  phone: '',
  businessName: '',
};

export default function ContactFormModal({ prefill, onClose }: ContactFormModalProps) {
  // This component is only ever mounted while the form is open (see ContactFormProvider),
  // so a fresh mount is all the "reset on open" behavior we need — no reset effect required.
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState(() => ({
    ...emptyFormState,
    biggestChallenge: prefill?.challenge ?? '',
    services: prefill?.services ?? [],
  }));
  const [dirty, setDirty] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [servicesAutoChecked, setServicesAutoChecked] = useState(() => Boolean(prefill?.services?.length));
  const [sourcePage] = useState(() => (typeof window !== 'undefined' ? window.location.pathname : ''));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
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
  }, []);

  function requestClose() {
    if (dirty) {
      setShowExitConfirm(true);
    } else {
      onClose();
    }
  }

  function discardAndClose() {
    setShowExitConfirm(false);
    onClose();
  }

  function selectChallenge(value: string) {
    setDirty(true);
    setForm((prev) => ({ ...prev, biggestChallenge: value }));
  }

  function toggleService(value: string) {
    setDirty(true);
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(value)
        ? prev.services.filter((s) => s !== value)
        : [...prev.services, value],
    }));
  }

  function updateField(field: keyof typeof emptyFormState, value: string) {
    setDirty(true);
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function goNext() {
    if (step === 1) {
      if (!servicesAutoChecked) {
        const mapped = CHALLENGE_TO_SERVICE[form.biggestChallenge];
        if (mapped && form.services.length === 0) {
          setForm((prev) => ({ ...prev, services: [mapped] }));
        }
        setServicesAutoChecked(true);
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  }

  function goBack() {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          biggest_challenge: form.biggestChallenge,
          services_interested: form.services,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          business_name: form.businessName.trim(),
          source_page: sourcePage,
        }),
      });
      if (!res.ok) throw new Error('Submission failed');
      setStep('confirmation');
    } catch {
      setSubmitError("Something went wrong sending that. Mind trying again?");
    } finally {
      setSubmitting(false);
    }
  }

  const step1Valid = form.biggestChallenge !== '';
  const step2Valid = form.services.length > 0;
  const step3Valid =
    form.name.trim() !== '' && EMAIL_RE.test(form.email.trim()) && isValidPhone(form.phone);

  const stepNumber = step === 'confirmation' ? null : step;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Contact intake form"
      tabIndex={-1}
      className="fixed inset-0 z-[100] bg-taam-near-black text-white overflow-y-auto outline-none"
    >
      {/* Header: progress + close */}
      <div className="sticky top-0 z-10 bg-taam-near-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          {stepNumber ? (
            <div className="flex items-center gap-3 flex-1">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-400 shrink-0">
                Step {stepNumber} of 3
              </span>
              <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden max-w-xs">
                <div
                  className="h-full bg-[#F46325] transition-all duration-300"
                  style={{ width: `${(stepNumber / 3) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close form"
            className="ml-4 text-white hover:text-[#F46325] transition shrink-0"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {step === 1 && (
          <StepChallenge value={form.biggestChallenge} onSelect={selectChallenge} />
        )}
        {step === 2 && (
          <StepServices value={form.services} onToggle={toggleService} />
        )}
        {step === 3 && (
          <StepContactInfo
            name={form.name}
            email={form.email}
            phone={form.phone}
            businessName={form.businessName}
            onChange={updateField}
            submitError={submitError}
          />
        )}
        {step === 'confirmation' && <Confirmation name={form.name} onClose={onClose} />}

        {step !== 'confirmation' && (
          <div className="flex items-center justify-between mt-10">
            {step === 2 || step === 3 ? (
              <button
                type="button"
                onClick={goBack}
                className="px-6 py-3 text-sm font-bold uppercase tracking-wide text-gray-400 hover:text-white transition"
              >
                ← Back
              </button>
            ) : (
              <span />
            )}

            {step === 3 ? (
              <button
                type="button"
                disabled={!step3Valid || submitting}
                onClick={handleSubmit}
                className="px-8 py-4 bg-[#F46325] text-white font-black text-sm md:text-base uppercase tracking-wide hover:bg-[#E55A1A] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending…' : 'Get My Free Recommendations'}
              </button>
            ) : (
              <button
                type="button"
                disabled={step === 1 ? !step1Valid : !step2Valid}
                onClick={goNext}
                className="px-8 py-4 bg-[#F46325] text-white font-black text-sm md:text-base uppercase tracking-wide hover:bg-[#E55A1A] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            )}
          </div>
        )}
      </div>

      {showExitConfirm && (
        <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center px-6">
          <div className="bg-[#181818] border border-gray-700 rounded-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-black mb-2">Discard your progress?</h3>
            <p className="text-sm text-gray-400 mb-6">
              Your answers won&apos;t be saved if you close this now.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 px-4 py-3 border border-gray-600 text-white text-sm font-bold uppercase tracking-wide hover:border-gray-400 transition"
              >
                Keep Going
              </button>
              <button
                type="button"
                onClick={discardAndClose}
                className="flex-1 px-4 py-3 bg-red-600 text-white text-sm font-bold uppercase tracking-wide hover:bg-red-700 transition"
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

function StepChallenge({ value, onSelect }: { value: string; onSelect: (v: string) => void }) {
  return (
    <div>
      <h2 className="text-3xl md:text-4xl font-black mb-2">What&apos;s your biggest challenge right now?</h2>
      <p className="text-gray-400 mb-8">Pick the one that fits best.</p>
      <div className="space-y-3" role="radiogroup" aria-label="Biggest challenge">
        {CHALLENGE_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          const Icon = iconMap[opt.icon];
          return (
            <label
              key={opt.value}
              className={`flex items-center gap-4 border rounded-lg px-5 py-4 cursor-pointer transition ${
                selected ? 'border-[#F46325] bg-[#F46325]/10' : 'border-gray-700 hover:border-gray-500'
              }`}
            >
              <input
                type="radio"
                name="biggest_challenge"
                value={opt.value}
                checked={selected}
                onChange={() => onSelect(opt.value)}
                className="accent-[#F46325] w-5 h-5 shrink-0"
              />
              {Icon && <Icon size={24} className="shrink-0 text-[#F46325]" />}
              <span className="font-semibold">{opt.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function StepServices({ value, onToggle }: { value: string[]; onToggle: (v: string) => void }) {
  return (
    <div>
      <h2 className="text-3xl md:text-4xl font-black mb-2">Which services are you interested in?</h2>
      <p className="text-gray-400 mb-8">Select all that apply.</p>
      <div className="space-y-3" role="group" aria-label="Services interested">
        {SERVICE_OPTIONS.map((opt) => {
          const selected = value.includes(opt.value);
          return (
            <label
              key={opt.value}
              className={`flex items-center gap-4 border rounded-lg px-5 py-4 cursor-pointer transition ${
                selected ? 'border-[#F46325] bg-[#F46325]/10' : 'border-gray-700 hover:border-gray-500'
              }`}
            >
              <input
                type="checkbox"
                value={opt.value}
                checked={selected}
                onChange={() => onToggle(opt.value)}
                className="accent-[#F46325] w-5 h-5 shrink-0"
              />
              <span className="font-semibold">{opt.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function StepContactInfo({
  name,
  email,
  phone,
  businessName,
  onChange,
  submitError,
}: {
  name: string;
  email: string;
  phone: string;
  businessName: string;
  onChange: (field: keyof typeof emptyFormState, value: string) => void;
  submitError: string | null;
}) {
  const inputClass =
    'w-full px-4 py-3 bg-gray-900 border border-gray-700 focus:border-[#F46325] outline-none text-white placeholder-gray-500 rounded transition';

  return (
    <div>
      <h2 className="text-3xl md:text-4xl font-black mb-8">
        Almost done! Where should we send your free recommendations?
      </h2>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-300" htmlFor="cf-name">
            Name
          </label>
          <input
            id="cf-name"
            type="text"
            required
            value={name}
            onChange={(e) => onChange('name', e.target.value)}
            className={inputClass}
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-300" htmlFor="cf-email">
            Email
          </label>
          <input
            id="cf-email"
            type="email"
            required
            value={email}
            onChange={(e) => onChange('email', e.target.value)}
            className={inputClass}
            placeholder="jane@business.com"
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-300" htmlFor="cf-phone">
            Phone
          </label>
          <input
            id="cf-phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => onChange('phone', e.target.value)}
            className={inputClass}
            placeholder="(555) 123-4567"
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-300" htmlFor="cf-business">
            Business Name <span className="text-gray-500 font-normal normal-case">(optional)</span>
          </label>
          <input
            id="cf-business"
            type="text"
            value={businessName}
            onChange={(e) => onChange('businessName', e.target.value)}
            className={inputClass}
            placeholder="Your Business"
          />
        </div>
      </div>
      {submitError && <p className="text-red-400 text-sm mt-4">{submitError}</p>}
    </div>
  );
}

function Confirmation({ name, onClose }: { name: string; onClose: () => void }) {
  const instagram = siteContent.contact.social.instagram;
  return (
    <div className="text-center py-10">
      <h2 className="text-4xl md:text-5xl font-black mb-4">You&apos;re all set! 🎉</h2>
      <p className="text-gray-300 text-lg max-w-lg mx-auto mb-10">
        Thanks, {name || 'friend'}! We&apos;ve received your info and one of our marketing specialists will
        reach out within 1 business day.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/work"
          onClick={onClose}
          className="px-8 py-4 bg-[#F46325] text-white font-black text-sm uppercase tracking-wide hover:bg-[#E55A1A] transition"
        >
          See Our Recent Work →
        </Link>
        {instagram && (
          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-gray-400 hover:text-white transition"
          >
            Follow us on Instagram
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="block mx-auto mt-8 text-xs uppercase tracking-wide text-gray-500 hover:text-white transition"
      >
        Close
      </button>
    </div>
  );
}
