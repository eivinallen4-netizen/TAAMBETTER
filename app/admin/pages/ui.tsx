'use client';

import { STATUS_LABEL, type PageStatus } from '@/lib/pages/rules';

// Bits shared by the /admin/pages screens.

export const STATUS_STYLE: Record<PageStatus, string> = {
  draft: 'bg-gray-700/60 text-gray-200',
  needs_review: 'bg-amber-500/15 text-amber-300',
  published: 'bg-emerald-500/15 text-emerald-300',
  archived: 'bg-red-500/10 text-red-300/80',
};

export function PageStatusBadge({ status }: { status: PageStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLE[status] ?? STATUS_STYLE.draft}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export const inputClass =
  'w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-white placeholder:text-gray-500 focus:border-[#F46325] focus:outline-none';

export const chip = (on: boolean) =>
  `rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${on ? 'bg-[#F46325] text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`;

export function when(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function day(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
