'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Arrow from '@/components/editorial/Arrow';

type Step = 1 | 2 | 3 | 'confirmation';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidPhone(phone: string) {
  return phone.replace(/\D/g, '').length >= 10;
}

const emptyFormState = {
  name: '',
  businessName: '',
  phone: '',
  salesRange: '',
};

export default function FreeVideoOfferPage() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState(emptyFormState);
  const [dirty, setDirty] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
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
  }, [dirty]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  function requestClose() {
    if (dirty) {
      setShowExitConfirm(true);
    } else {
      window.location.href = '/';
    }
  }

  function discardAndClose() {
    setShowExitConfirm(false);
    window.location.href = '/';
  }

  function updateField(field: keyof typeof emptyFormState, value: string) {
    setDirty(true);
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function goNext() {
    if (step === 1) {
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
    // The free week is only for businesses already making sales, so a zero-sales answer isn't sent.
    if (form.salesRange === '0') {
      setStep('confirmation');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/free-video-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          business_name: form.businessName.trim(),
          sales_range: form.salesRange,
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

  const step1Valid = form.name.trim() !== '';
  const step2Valid = form.businessName.trim() !== '' && isValidPhone(form.phone);
  const step3Valid = form.salesRange !== '';

  const stepNumber = step === 'confirmation' ? null : step;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Free video offer form"
      tabIndex={-1}
      className="fixed inset-0 z-[100] tone-orange overflow-y-auto outline-none"
    >
      {/* Header: progress + close */}
      <div className="sticky top-0 z-10 bg-taam-orange border-b-2 border-white/40">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          {stepNumber ? (
            <div className="flex items-center gap-3 flex-1">
              <span className="eyebrow shrink-0">
                STEP {stepNumber} OF 3
              </span>
              <div className="flex-1 h-[3px] bg-white/30 overflow-hidden max-w-xs">
                <div
                  className="h-full bg-white transition-all duration-500"
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
            className="ml-4 shrink-0 hover:opacity-70 transition"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-14 md:py-20">
        {step === 1 && (
          <StepName value={form.name} onChange={(value) => updateField('name', value)} />
        )}
        {step === 2 && (
          <StepCompanyInfo
            businessName={form.businessName}
            phone={form.phone}
            onBusinessNameChange={(value) => updateField('businessName', value)}
            onPhoneChange={(value) => updateField('phone', value)}
          />
        )}
        {step === 3 && (
          <StepSalesRange value={form.salesRange} onChange={(value) => updateField('salesRange', value)} submitError={submitError} />
        )}
        {step === 'confirmation' && <Confirmation name={form.name} noSalesYet={form.salesRange === '0'} />}

        {step !== 'confirmation' && (
          <div className="flex items-center justify-between mt-10">
            {step === 2 || step === 3 ? (
              <button
                type="button"
                onClick={goBack}
                className="eyebrow link-line py-3"
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
                className="btn btn-solid disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                {submitting ? 'Sending…' : 'Last Step'}
              </button>
            ) : (
              <button
                type="button"
                disabled={step === 1 ? !step1Valid : !step2Valid}
                onClick={goNext}
                className="btn btn-solid disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                {step === 1 ? 'Continue' : 'One Step Closer'} <Arrow dir="right" />
              </button>
            )}
          </div>
        )}
      </div>

      {showExitConfirm && (
        <div className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center px-6">
          <div className="tone-ink rounded-[var(--radius-card)] max-w-sm w-full p-8">
            <h3 className="display display-sm mb-3">Discard your progress?</h3>
            <p className="text-sm text-white/70 mb-6">Your answers won't be saved if you close this now.</p>
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

function StepName({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <h2 className="display display-md mb-5">LET'S GET YOU A FREE WEEK OF VIDEO</h2>
      <p className="lede mb-4 text-white/85">
        A full week of content for your business, on us. This offer is only for businesses that are already open
        and making sales.
      </p>
      <p className="mb-10 text-sm text-white/75">You will be contacted to confirm important info</p>
      <div className="space-y-5">
        <div>
          <label className="block eyebrow mb-2" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-white/50 focus:border-white outline-none text-white text-xl font-semibold placeholder-white/50 transition"
            placeholder="Your Name"
          />
        </div>
      </div>
    </div>
  );
}

function StepCompanyInfo({
  businessName,
  phone,
  onBusinessNameChange,
  onPhoneChange,
}: {
  businessName: string;
  phone: string;
  onBusinessNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
}) {
  const inputClass =
    'w-full px-0 py-3 bg-transparent border-0 border-b-2 border-white/50 focus:border-white outline-none text-white text-xl font-semibold placeholder-white/50 transition';

  return (
    <div>
      <h2 className="display display-md mb-5">You're almost there</h2>
      <p className="lede mb-10 text-white/85">Confirm important info</p>
      <div className="space-y-5">
        <div>
          <label className="block eyebrow mb-2" htmlFor="company">
            What's your company name?
          </label>
          <input
            id="company"
            type="text"
            required
            value={businessName}
            onChange={(e) => onBusinessNameChange(e.target.value)}
            className={inputClass}
            placeholder="Your Company"
          />
        </div>
        <div>
          <label className="block eyebrow mb-2" htmlFor="phone">
            What's your number?
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            className={inputClass}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>
    </div>
  );
}

function StepSalesRange({
  value,
  onChange,
  submitError,
}: {
  value: string;
  onChange: (v: string) => void;
  submitError: string | null;
}) {
  return (
    <div>
      <h2 className="display display-md mb-5">LAST STEP - IT'S ALL OR NOTHING</h2>
      <p className="lede mb-10 text-white/85">How many sales have you made this year?</p>
      <div className="space-y-3" role="radiogroup" aria-label="Sales range">
        {[
          { value: '0', label: '0' },
          { value: '1-5', label: '1-5' },
          { value: '5-15', label: '5-15' },
          { value: '45+', label: '45+' },
        ].map((opt) => {
          const selected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`flex items-center gap-4 rounded-full px-6 py-4 cursor-pointer transition ${
                selected ? 'bg-white text-taam-near-black' : 'shadow-[inset_0_0_0_2px_rgba(255,255,255,0.55)] hover:shadow-[inset_0_0_0_2px_#fff]'
              }`}
            >
              <input
                type="radio"
                name="sales_range"
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="accent-taam-near-black w-5 h-5 shrink-0"
              />
              <span className="font-semibold">{opt.label}</span>
            </label>
          );
        })}
      </div>
      {submitError && <p className="mt-4 inline-block rounded-lg bg-taam-near-black px-4 py-3 text-sm font-semibold">{submitError}</p>}
    </div>
  );
}

function Confirmation({ name, noSalesYet }: { name: string; noSalesYet: boolean }) {
  if (noSalesYet) {
    return (
      <div className="text-center py-10">
        <h2 className="display display-lg mb-6">Not quite yet</h2>
        <p className="lede max-w-lg mx-auto mb-10">
          The free week of video is only for businesses that are already open and making sales. Once the first
          sales are in, come back and we&apos;ll get you filmed.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/tools" className="btn btn-solid">
            Try our free tools <Arrow dir="right" />
          </Link>
        </div>
        <Link
          href="/"
          className="block mx-auto mt-8 eyebrow opacity-80 hover:opacity-100 transition"
        >
          Close
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center py-10">
      <h2 className="display display-lg mb-6">Thanks for Attending</h2>
      <p className="lede max-w-lg mx-auto mb-10">We will reach out shortly.</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/"
          className="btn btn-solid"
        >
          Check Us Out <Arrow dir="right" />
        </Link>
      </div>
      <Link
        href="/"
        className="block mx-auto mt-8 eyebrow opacity-80 hover:opacity-100 transition"
      >
        Close
      </Link>
    </div>
  );
}
