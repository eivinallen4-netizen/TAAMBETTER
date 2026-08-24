'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

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
      className="fixed inset-0 z-[100] bg-taam-near-black text-white overflow-y-auto outline-none"
    >
      {/* Header: progress + close */}
      <div className="sticky top-0 z-10 bg-taam-near-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          {stepNumber ? (
            <div className="flex items-center gap-3 flex-1">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-400 shrink-0">
                STEP {stepNumber} OF 3
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
        {step === 'confirmation' && <Confirmation name={form.name} />}

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
                {submitting ? 'Sending…' : 'Last Step'}
              </button>
            ) : (
              <button
                type="button"
                disabled={step === 1 ? !step1Valid : !step2Valid}
                onClick={goNext}
                className="px-8 py-4 bg-[#F46325] text-white font-black text-sm md:text-base uppercase tracking-wide hover:bg-[#E55A1A] transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {step === 1 ? 'Continue' : 'One Step Closer'} →
              </button>
            )}
          </div>
        )}
      </div>

      {showExitConfirm && (
        <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center px-6">
          <div className="bg-[#181818] border border-gray-700 rounded-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-black mb-2">Discard your progress?</h3>
            <p className="text-sm text-gray-400 mb-6">Your answers won't be saved if you close this now.</p>
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

function StepName({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <h2 className="text-3xl md:text-4xl font-black mb-2">LET'S GET YOUR FREE VIDEO</h2>
      <p className="text-gray-400 mb-8">You will be contacted to confirm important info</p>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-300" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 focus:border-[#F46325] outline-none text-white placeholder-gray-500 rounded transition"
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
    'w-full px-4 py-3 bg-gray-900 border border-gray-700 focus:border-[#F46325] outline-none text-white placeholder-gray-500 rounded transition';

  return (
    <div>
      <h2 className="text-3xl md:text-4xl font-black mb-2">You're almost there</h2>
      <p className="text-gray-400 mb-8">Confirm important info</p>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold mb-2 text-gray-300" htmlFor="company">
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
          <label className="block text-sm font-bold mb-2 text-gray-300" htmlFor="phone">
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
      <h2 className="text-3xl md:text-4xl font-black mb-2">LAST STEP - IT'S ALL OR NOTHING</h2>
      <p className="text-gray-400 mb-8">How many sales have you made this year?</p>
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
              className={`flex items-center gap-4 border rounded-lg px-5 py-4 cursor-pointer transition ${
                selected ? 'border-[#F46325] bg-[#F46325]/10' : 'border-gray-700 hover:border-gray-500'
              }`}
            >
              <input
                type="radio"
                name="sales_range"
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="accent-[#F46325] w-5 h-5 shrink-0"
              />
              <span className="font-semibold">{opt.label}</span>
            </label>
          );
        })}
      </div>
      {submitError && <p className="text-red-400 text-sm mt-4">{submitError}</p>}
    </div>
  );
}

function Confirmation({ name }: { name: string }) {
  return (
    <div className="text-center py-10">
      <h2 className="text-4xl md:text-5xl font-black mb-4">Thanks for Attending</h2>
      <p className="text-gray-300 text-lg max-w-lg mx-auto mb-10">We will reach out shortly.</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/"
          className="px-8 py-4 bg-[#F46325] text-white font-black text-sm uppercase tracking-wide hover:bg-[#E55A1A] transition"
        >
          Check Us Out →
        </Link>
      </div>
      <Link
        href="/"
        className="block mx-auto mt-8 text-xs uppercase tracking-wide text-gray-500 hover:text-white transition"
      >
        Close
      </Link>
    </div>
  );
}
