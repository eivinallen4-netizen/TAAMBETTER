'use client';

import { useState } from 'react';
import { Check, Copy, Globe, Share2 } from 'lucide-react';
import { KIND_LABELS, type OnboardingKind } from '@/app/lib/onboarding';

export type LinkKind = Exclude<OnboardingKind, 'full'>;

export const KIND_META: Record<LinkKind, { icon: typeof Globe; covers: string }> = {
  website: {
    icon: Globe,
    covers: 'Their current site, website login, domain, what they sell, and links to their reviews.',
  },
  social: {
    icon: Share2,
    covers: 'Every social account with logins and 2FA contact, plus what they sell and links to their reviews.',
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
