'use client';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Arrow from '@/components/editorial/Arrow';
import { EXPERIENCE_OPTIONS } from '@/app/lib/careers';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  'w-full px-0 py-3 bg-transparent border-0 border-b-2 border-white/50 focus:border-white outline-none text-white text-lg md:text-xl font-semibold placeholder-white/50 transition';

interface Props {
  role: string;
  roleTitle: string;
  linkLabel: string;
  proofLabel: string;
  proofPlaceholder: string;
}

export default function ApplicationForm({ role, roleTitle, linkLabel, proofLabel, proofPlaceholder }: Props) {
  const startedAt = useRef(Date.now());
  const [form, setForm] = useState({ name: '', email: '', phone: '', experience: '', link: '', proof: '', why: '', company_fax: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (field: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const valid =
    form.name.trim() !== '' &&
    EMAIL_RE.test(form.email.trim()) &&
    form.phone.replace(/\D/g, '').length >= 10 &&
    form.experience !== '' &&
    form.link.trim() !== '' &&
    form.proof.trim() !== '';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/careers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role, elapsed_ms: Date.now() - startedAt.current }),
      });
      if (!res.ok) throw new Error('Submission failed');
      setDone(true);
    } catch {
      setError('Something went wrong sending that. Mind trying again?');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="py-6">
        <p className="eyebrow mb-6">Application received</p>
        <h3 className="display display-lg mb-8">
          Thanks,
          <br />
          <span className="outline-type">{form.name.trim().split(/\s+/)[0]}.</span>
        </h3>
        <p className="lede max-w-lg mb-10">
          We read every application ourselves. If your numbers back it up, we&apos;ll call you to set up a conversation.
        </p>
        <Link href="/work" className="btn btn-solid">
          See our work <Arrow dir="right" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      <div className="grid gap-8 md:grid-cols-2">
        <Field id="name" label="Full name">
          <input id="name" type="text" autoComplete="name" required value={form.name} onChange={set('name')} className={inputClass} placeholder="Your name" />
        </Field>
        <Field id="email" label="Email">
          <input id="email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} className={inputClass} placeholder="you@email.com" />
        </Field>
        <Field id="phone" label="Phone">
          <input id="phone" type="tel" autoComplete="tel" required value={form.phone} onChange={set('phone')} className={inputClass} placeholder="(555) 123-4567" />
        </Field>
        <Field id="link" label={linkLabel}>
          <input id="link" type="url" required value={form.link} onChange={set('link')} className={inputClass} placeholder="https://" />
        </Field>
      </div>

      <fieldset>
        <legend className="eyebrow mb-4">Years doing this job</legend>
        <div className="flex flex-wrap gap-3">
          {EXPERIENCE_OPTIONS.map((opt) => {
            const selected = form.experience === opt.value;
            return (
              <label
                key={opt.value}
                className={`cursor-pointer rounded-full px-5 py-3 font-semibold transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-white ${
                  selected ? 'bg-white text-taam-near-black' : 'shadow-[inset_0_0_0_2px_rgba(255,255,255,0.55)] hover:shadow-[inset_0_0_0_2px_#fff]'
                }`}
              >
                <input type="radio" name="experience" value={opt.value} checked={selected} onChange={set('experience')} className="sr-only" />
                {opt.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <Field id="proof" label={proofLabel}>
        <textarea id="proof" required rows={4} value={form.proof} onChange={set('proof')} className={`${inputClass} resize-y`} placeholder={proofPlaceholder} />
      </Field>

      <Field id="why" label={`Why TAAM, why ${roleTitle.toLowerCase()} (optional)`}>
        <textarea id="why" rows={3} value={form.why} onChange={set('why')} className={`${inputClass} resize-y`} placeholder="A few lines is plenty." />
      </Field>

      {/* Honeypot: hidden from people, bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="company_fax">Company fax</label>
        <input id="company_fax" type="text" tabIndex={-1} autoComplete="off" value={form.company_fax} onChange={set('company_fax')} />
      </div>

      {error && <p className="inline-block rounded-lg bg-taam-near-black px-4 py-3 text-sm font-semibold">{error}</p>}

      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-2">
        <button type="submit" disabled={!valid || submitting} className="btn btn-solid disabled:opacity-40 disabled:cursor-not-allowed">
          {submitting ? 'Sending…' : 'Send application'} <Arrow dir="right" />
        </button>
        <p className="text-sm font-semibold opacity-85">Senior applicants only. We can&apos;t train yet.</p>
      </div>
    </form>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block eyebrow mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}
