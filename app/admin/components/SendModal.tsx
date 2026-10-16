'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle2, Globe, Link2, Search, Send, Share2, Video, X, type LucideIcon } from 'lucide-react';
import { MESSAGE_META, MESSAGE_TYPES, type MessageType, type RecipientSource } from '@/app/lib/crm-messages';
import type { Person } from '@/app/api/admin/people/route';
import Arrow from '@/components/editorial/Arrow';
import { CopyButton } from './NewOnboardingModal';

// One place to send anyone in the CRM a branded email: onboarding (paid clients), a Zoom link, or any link.
// Shows the exact email as it will land, before it goes.

export interface Recipient {
  name: string;
  email: string;
  businessName: string;
  source: RecipientSource;
  sourceId: string;
  /** Already confirmed as paid, e.g. an onboarding link being re-sent. */
  paid?: boolean;
}

const ICONS: Record<MessageType, LucideIcon> = {
  website_onboarding: Globe,
  social_onboarding: Share2,
  zoom: Video,
  link: Link2,
};

const EMPTY: Recipient = { name: '', email: '', businessName: '', source: 'manual', sourceId: '' };

function PersonPicker({ onPick }: { onPick: (p: Person) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Person[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetch(`/api/admin/people?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then((d) => setResults(d.data ?? []))
        .catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          placeholder="Search your CRM by name, email or business…"
          className="w-full rounded-lg border border-gray-700 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 focus:border-[#F46325] focus:outline-none"
        />
      </div>
      <ul className="mt-2 max-h-56 divide-y divide-gray-800 overflow-y-auto">
        {results.length === 0 ? (
          <li className="px-2 py-3 text-sm text-gray-500">Nobody matches. Type their details in below instead.</li>
        ) : (
          results.map((p) => (
            <li key={`${p.source}-${p.id}`}>
              <button type="button" onClick={() => onPick(p)} className="flex w-full items-center justify-between gap-3 px-2 py-2.5 text-left hover:bg-gray-800">
                <span className="min-w-0">
                  <span className="block truncate font-bold text-white">{p.name || p.email}</span>
                  <span className="block truncate text-xs text-gray-400">{[p.business, p.email || p.phone].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="shrink-0 rounded border border-gray-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {p.source === 'lead' ? 'Video lead' : p.source}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function SendModal({
  recipient,
  defaultType = 'website_onboarding',
  onClose,
  onSent,
}: {
  /** Leave out to pick someone from the CRM. */
  recipient?: Recipient;
  defaultType?: MessageType;
  onClose: () => void;
  onSent?: () => void;
}) {
  const [to, setTo] = useState<Recipient>(recipient ?? EMPTY);
  const [picking, setPicking] = useState(!recipient);
  const [type, setType] = useState<MessageType>(defaultType);
  const [link, setLink] = useState('');
  const [when, setWhen] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [paid, setPaid] = useState(!!recipient?.paid);
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ link: string; onboardingId: string | null; emailed: boolean } | null>(null);

  const meta = MESSAGE_META[type];
  const isOnboarding = meta.needsPaid;
  const firstName = to.name.trim().split(/\s+/)[0];

  useEffect(() => {
    const t = setTimeout(() => {
      fetch('/api/admin/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preview: true, type, name: to.name, businessName: to.businessName, link, when, title, note }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setPreview(d))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [type, to.name, to.businessName, link, when, title, note]);

  function pick(p: Person) {
    setTo({ name: p.name, email: p.email, businessName: p.business, source: p.source, sourceId: p.id });
    setPicking(false);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, email: to.email, name: to.name, businessName: to.businessName, source: to.source, sourceId: to.sourceId, link, when, title, note, paid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not send');
      setDone({ link: data.link, onboardingId: data.onboardingId, emailed: true });
      onSent?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send');
    } finally {
      setBusy(false);
    }
  }

  // For clients you'd rather text: make the onboarding link without emailing it.
  async function linkOnly() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: type === 'website_onboarding' ? 'website' : 'social', clientName: to.name, businessName: to.businessName, email: to.email, message: note, paid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create link');
      setDone({ link: data.url, onboardingId: data.id, emailed: false });
      onSent?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create link');
    } finally {
      setBusy(false);
    }
  }

  const input = 'w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white placeholder:text-gray-500 focus:border-[#F46325] focus:outline-none';
  const canSend = !!to.email && (!isOnboarding || (paid && !!to.name)) && (!meta.needsLink || /^https?:\/\/\S+$/i.test(link));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-5xl rounded-xl border border-gray-700 bg-gray-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <Send className="h-6 w-6 text-[#F46325]" />
            {done ? (done.emailed ? 'Sent' : 'Link ready') : `Send to ${firstName || 'someone in your CRM'}`}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="p-6">
            <p className="mb-3 flex items-center gap-2 text-gray-200">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              {done.emailed ? `Branded email sent to ${to.email}.` : `Send this to ${firstName || 'your client'}. It's private to them and saves their progress.`}
            </p>
            <div className="mb-4 break-all rounded-lg border border-gray-700 bg-gray-800 p-3 font-mono text-sm text-[#FF9A66]">{done.link}</div>
            <div className="flex flex-wrap items-center gap-2">
              <CopyButton text={done.link} />
              {done.onboardingId && (
                <Link href={`/admin/onboarding/${done.onboardingId}`} className="ml-auto text-sm font-semibold text-[#F46325] hover:underline">
                  Open client <Arrow dir="right" />
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_minmax(0,26rem)]">
            <form onSubmit={send} className="space-y-5 p-6">
              <div>
                <span className="mb-2 block text-sm font-bold text-gray-300">What are you sending?</span>
                <div className="grid grid-cols-2 gap-2">
                  {MESSAGE_TYPES.map((t) => {
                    const Icon = ICONS[t];
                    const active = t === type;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-bold transition ${
                          active ? 'border-[#F46325] bg-[#F46325]/15 text-white' : 'border-gray-700 text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#F46325]' : ''}`} /> {MESSAGE_META[t].label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-gray-500">{meta.hint}</p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-300">To</span>
                  {!picking && (
                    <button type="button" onClick={() => setPicking(true)} className="text-xs font-semibold text-[#F46325] hover:underline">
                      Pick from CRM
                    </button>
                  )}
                </div>
                {picking && <PersonPicker onPick={pick} />}
                <div className={`grid gap-3 sm:grid-cols-2 ${picking ? 'mt-3' : ''}`}>
                  <input className={input} value={to.name} onChange={(e) => setTo({ ...to, name: e.target.value })} placeholder="Name" aria-label="Name" />
                  <input className={input} value={to.businessName} onChange={(e) => setTo({ ...to, businessName: e.target.value })} placeholder="Business" aria-label="Business" />
                  <input
                    type="email"
                    className={`${input} sm:col-span-2`}
                    value={to.email}
                    onChange={(e) => setTo({ ...to, email: e.target.value })}
                    placeholder="Email"
                    aria-label="Email"
                  />
                </div>
                {to.source === 'lead' && !to.email && <p className="mt-1 text-xs text-amber-300">Video leads only leave a phone number. Add their email to send.</p>}
              </div>

              {type === 'zoom' && (
                <>
                  <input className={input} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://zoom.us/j/…" aria-label="Zoom link" />
                  <input className={input} value={when} onChange={(e) => setWhen(e.target.value)} placeholder="When, e.g. Tue Oct 21 · 2:00pm PT" aria-label="When" />
                  <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Call name (optional), e.g. Kickoff call" aria-label="Call name" />
                </>
              )}
              {type === 'link' && (
                <>
                  <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is it? e.g. Your proposal" aria-label="Title" />
                  <input className={input} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" aria-label="Link" />
                  <input className={input} value={when} onChange={(e) => setWhen(e.target.value)} placeholder="Button text (optional), e.g. View proposal" aria-label="Button text" />
                </>
              )}

              <label className="block">
                <span className="mb-1 block text-sm font-bold text-gray-300">Personal note</span>
                <textarea
                  className={`${input} resize-y`}
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={isOnboarding ? 'Pumped to get started. Fill this out and we’ll kick off this week.' : 'Optional'}
                />
                {isOnboarding && <span className="mt-1 block text-xs text-gray-500">Also shows on their onboarding welcome page.</span>}
              </label>

              {isOnboarding && (
                <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${paid ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-amber-500/50 bg-amber-500/5'}`}>
                  <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="mt-1 h-4 w-4 accent-[#F46325]" />
                  <span className="text-sm">
                    <span className="block font-bold text-white">{firstName || 'This client'} has paid</span>
                    <span className="text-gray-400">Onboarding only goes out after payment. This marks them as a paid client.</span>
                  </span>
                </label>
              )}

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={busy || !canSend} className="flex-1 rounded-lg bg-[#F46325] py-3 font-bold text-white hover:bg-[#FF7B42] disabled:opacity-50">
                  {busy ? 'Sending…' : 'Send branded email'}
                </button>
                {isOnboarding && (
                  <button
                    type="button"
                    onClick={linkOnly}
                    disabled={busy || !paid || !to.name}
                    className="rounded-lg border border-gray-600 px-4 py-3 text-sm font-bold text-gray-300 hover:border-[#F46325] hover:text-white disabled:opacity-50"
                    title="Create the link without emailing it, e.g. to text it"
                  >
                    Just make the link
                  </button>
                )}
              </div>
            </form>

            <div className="border-t border-gray-800 bg-black/30 p-4 lg:border-l lg:border-t-0">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">Preview</p>
              <p className="mb-3 truncate text-sm font-bold text-gray-200">{preview?.subject ?? '…'}</p>
              <iframe
                title="Email preview"
                srcDoc={preview?.html ?? ''}
                sandbox=""
                className="h-[28rem] w-full rounded-lg border border-gray-800 bg-[#111] lg:h-[36rem]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
