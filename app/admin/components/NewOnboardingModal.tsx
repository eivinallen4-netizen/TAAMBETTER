'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Copy, Globe, Mail, Share2, X } from 'lucide-react';
import { KIND_LABELS, type OnboardingKind } from '@/app/lib/onboarding';

export type LinkKind = Exclude<OnboardingKind, 'full'>;

export const KIND_META: Record<LinkKind, { icon: typeof Globe; covers: string; emailSubject: string; emailLine: string }> = {
  website: {
    icon: Globe,
    covers: 'Their current site, website login, domain, what they sell, and links to their reviews.',
    emailSubject: 'Your TAAM website onboarding',
    emailLine: "Here's your website onboarding link. It covers your current site, logins, what you offer, and where your reviews are",
  },
  social: {
    icon: Share2,
    covers: 'Every social account with logins and 2FA contact, plus what they sell and links to their reviews.',
    emailSubject: 'Your TAAM social media onboarding',
    emailLine: "Here's your social media onboarding link. It's where you'll add your accounts and logins so we can get posting",
  },
};

export function CopyButton({ text, label = 'Copy link' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-gray-600 px-2.5 py-1 text-xs font-semibold text-gray-300 hover:border-[#F46325] hover:text-white"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied' : label}
    </button>
  );
}

export function KindBadge({ kind }: { kind: OnboardingKind }) {
  const style =
    kind === 'website'
      ? 'border-sky-500/50 text-sky-300'
      : kind === 'social'
        ? 'border-fuchsia-500/50 text-fuchsia-300'
        : 'border-gray-600 text-gray-300';
  return <span className={`inline-block whitespace-nowrap rounded border px-2 py-0.5 text-xs font-bold ${style}`}>{KIND_LABELS[kind]}</span>;
}

export function NewOnboardingModal({ kind, onClose, onCreated }: { kind: LinkKind; onClose: () => void; onCreated?: () => void }) {
  const [form, setForm] = useState({ clientName: '', businessName: '', email: '', message: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ id: string; url: string } | null>(null);
  const meta = KIND_META[kind];
  const Icon = meta.icon;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, kind }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create link');
      setCreated(data);
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create link');
    } finally {
      setSaving(false);
    }
  }

  const input = 'w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-white placeholder:text-gray-500 focus:border-[#F46325] focus:outline-none';
  const firstName = form.clientName.trim().split(/\s+/)[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <Icon className="h-6 w-6 text-[#F46325]" />
            {created ? 'Link ready' : `New ${KIND_LABELS[kind].toLowerCase()} link`}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {!created && <p className="mb-5 text-sm text-gray-400">{meta.covers}</p>}

        {created ? (
          <div className="mt-4">
            <p className="mb-3 text-gray-300">Send this to {firstName || 'your client'}. It&apos;s private to them and saves their progress.</p>
            <div className="mb-4 break-all rounded-lg border border-gray-700 bg-gray-800 p-3 font-mono text-sm text-[#FF9A66]">{created.url}</div>
            <div className="flex flex-wrap items-center gap-2">
              <CopyButton text={created.url} />
              {form.email && (
                <a
                  href={`mailto:${form.email}?subject=${encodeURIComponent(meta.emailSubject)}&body=${encodeURIComponent(
                    `Hey ${firstName},\n\nWelcome to TAAM! ${meta.emailLine}. It only takes a few minutes and saves as you go:\n\n${created.url}\n\nTalk soon,\nTAAM`
                  )}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-600 px-2.5 py-1 text-xs font-semibold text-gray-300 hover:border-[#F46325] hover:text-white"
                >
                  <Mail className="h-3.5 w-3.5" /> Email it
                </a>
              )}
              <Link href={`/admin/onboarding/${created.id}`} className="ml-auto text-sm font-semibold text-[#F46325] hover:underline">
                Open client →
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={create} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-gray-300">Client&apos;s name *</span>
              <input className={input} value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="Sarah Johnson" required autoFocus />
              <span className="mt-1 block text-xs text-gray-500">Shown on every page: “Welcome, {firstName || 'Sarah'}.”</span>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-gray-300">Business name</span>
              <input className={input} value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="Johnson Dental" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-gray-300">Client email</span>
              <input type="email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="sarah@johnsondental.com" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-gray-300">Personal note</span>
              <textarea
                className={`${input} resize-y`}
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Great talking today! Fill this out and we'll get started this week."
              />
              <span className="mt-1 block text-xs text-gray-500">Shows up on their welcome page.</span>
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={saving} className="w-full rounded-lg bg-[#F46325] py-3 font-bold text-white hover:bg-[#FF7B42] disabled:opacity-60">
              {saving ? 'Creating…' : 'Create link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
