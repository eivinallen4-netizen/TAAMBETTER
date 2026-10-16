'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { FreeTool } from '@/app/lib/tools';
import Mascot from '@/components/editorial/Mascot';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STORAGE_KEY = 'taam-tools-contact';

interface Remembered {
  name: string;
  email: string;
}

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseRemembered(raw: string | null): Remembered | null {
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed.email === 'string' && EMAIL_RE.test(parsed.email) ? parsed : null;
  } catch {
    return null;
  }
}

function subscribeStorage(onChange: () => void) {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

interface LeadOptions {
  website?: string;
  trap?: string;
  /** Email the full report (and sync to the CRM) with this payload. */
  report?: unknown;
  /** Attach a PDF copy of the report to the email. */
  pdf?: boolean;
}

function sendLead(tool: FreeTool, contact: Remembered, summary: string, { website, trap = '', report, pdf = false }: LeadOptions = {}) {
  return fetch('/api/tool-leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool: tool.slug, ...contact, summary, website, company_fax: trap, deliver: report !== undefined, report, pdf }),
  });
}

interface EmailGateProps {
  tool: FreeTool;
  /** Plain-text result summary saved with the lead, so the team sees what the visitor saw. */
  summary: string;
  website?: string;
  /** The tool's inputs/result, sent so the server can rebuild and email the full report. */
  report: unknown;
  /** What the full report contains, shown on the locked card. */
  teaser: string[];
  children: ReactNode;
}

/**
 * The headline result is always free; the detailed fix list sits behind an email. Visitors who
 * already unlocked one tool aren't asked again (their new result is still saved for follow-up).
 */
export default function EmailGate({ tool, summary, website, report, teaser, children }: EmailGateProps) {
  // A previous unlock lives in storage (absent during server render, so it is read as an external store).
  const stored = useSyncExternalStore(subscribeStorage, readStored, () => null);
  const remembered = useMemo(() => parseRemembered(stored), [stored]);
  const [justUnlocked, setJustUnlocked] = useState<Remembered | null>(null);
  const contact = justUnlocked ?? remembered;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [trap, setTrap] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const sentFor = useRef<string | null>(null);
  // Which result was emailed, so a changed result offers to send again.
  const [emailedFor, setEmailedFor] = useState<string | null>(null);
  const [emailing, setEmailing] = useState(false);
  const [wantPdf, setWantPdf] = useState(true);

  // Returning visitor: save this new result against their email, once per result. Debounced so
  // calculators (whose summary changes on every keystroke) only save where the visitor settles.
  useEffect(() => {
    if (!contact || sentFor.current === summary) return;
    const timer = setTimeout(() => {
      sentFor.current = summary;
      sendLead(tool, contact, summary, { website }).catch(() => {});
    }, 4000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact, summary]);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email so we can unlock your report.');
      return;
    }
    setError(null);
    setSending(true);
    const next = { name: name.trim(), email: email.trim() };
    sentFor.current = summary;
    try {
      await sendLead(tool, next, summary, { website, trap, report, pdf: wantPdf });
      setEmailedFor(summary);
    } catch {
      // The report unlocks regardless; a lost lead beats a frustrated visitor.
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    setSending(false);
    setJustUnlocked(next);
  }

  async function emailReport() {
    if (!contact) return;
    setEmailing(true);
    sentFor.current = summary;
    try {
      await sendLead(tool, contact, summary, { website, report, pdf: wantPdf });
    } catch {}
    setEmailing(false);
    setEmailedFor(summary);
  }

  if (contact) {
    const emailed = emailedFor === summary;
    return (
      <div>
        <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="eyebrow text-[color:var(--tone-muted)]">
            Full report · {emailed ? `a copy is on its way to ${contact.email}` : `unlocked for ${contact.email}`}
          </p>
          {!emailed && (
            <>
              <button type="button" onClick={emailReport} disabled={emailing} className="eyebrow underline underline-offset-4 hover:text-taam-orange disabled:opacity-60">
                {emailing ? 'Sending…' : 'Email me this report'}
              </button>
              <PdfToggle checked={wantPdf} onChange={setWantPdf} compact />
            </>
          )}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="relative rounded-[var(--radius-card)] border-2 rule p-8 md:p-12 md:mt-28">
      {/* Trophy pose standing on the card's top edge: the report is the prize. */}
      <Mascot
        pose="famous"
        size={128}
        className="mascot-pop hidden md:block absolute bottom-[calc(100%-4px)] right-10 w-28 lg:w-32 h-auto"
      />
      <div className="grid grid-cols-12 gap-x-6 gap-y-10">
        <div className="col-span-12 lg:col-span-6">
          <p className="eyebrow mb-4">Free full report</p>
          <h3 className="display display-md">Get the fix list.</h3>
          <ul className="mt-8 space-y-3">
            {teaser.map((t) => (
              <li key={t} className="flex gap-4 text-lg font-medium leading-snug">
                <span aria-hidden="true" className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-taam-near-black">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={unlock} noValidate className="col-span-12 lg:col-span-5 lg:col-start-8 self-center space-y-4">
          <label className="block">
            <span className="eyebrow mb-2 block">First name</span>
            <input
              type="text"
              autoComplete="given-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-full bg-white/10 px-6 py-4 text-lg font-semibold outline-none placeholder:text-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white"
              placeholder="Alex"
            />
          </label>
          <label className="block">
            <span className="eyebrow mb-2 block">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? 'gate-error' : undefined}
              className="w-full rounded-full bg-white/10 px-6 py-4 text-lg font-semibold outline-none placeholder:text-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white"
              placeholder="you@business.com"
            />
          </label>
          {/* Honeypot for bots; hidden from people and assistive tech. */}
          <input
            type="text"
            name="company_fax"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={trap}
            onChange={(e) => setTrap(e.target.value)}
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />
          {error && (
            <p id="gate-error" role="alert" className="font-semibold text-taam-orange">
              {error}
            </p>
          )}
          <PdfToggle checked={wantPdf} onChange={setWantPdf} />
          <button type="submit" disabled={sending} className="btn btn-solid w-full justify-center disabled:opacity-60">
            {sending ? 'Unlocking…' : 'Unlock the full report'}
          </button>
          <p className="text-sm font-medium text-[color:var(--tone-muted)]">
            Free and instant: it opens right here, and we email you a copy to keep. No spam: at most one follow-up from a real person on our team.
          </p>
        </form>
      </div>
    </div>
  );
}

function PdfToggle({ checked, onChange, compact = false }: { checked: boolean; onChange: (v: boolean) => void; compact?: boolean }) {
  return (
    <label className={`flex cursor-pointer select-none items-center gap-3 ${compact ? 'eyebrow text-[color:var(--tone-muted)]' : 'font-semibold'}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white text-xs font-black text-taam-near-black peer-checked:bg-white peer-focus-visible:ring-2 peer-focus-visible:ring-white peer-focus-visible:ring-offset-2"
      >
        {checked ? '✓' : ''}
      </span>
      {compact ? 'Attach PDF' : 'Attach a downloadable PDF copy'}
    </label>
  );
}
