import { LEAD_FIT_LABELS, type LeadFit } from '@/app/lib/cta';
import type { Recipient } from '../components/SendModal';

// Small pieces shared by the contacts list and a contact's page.

const STATUS: Record<string, { label: string; className: string }> = {
  paid: { label: 'Paid client', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  complete: { label: 'Filled out form', className: 'bg-sky-500/10 text-sky-300 border-sky-500/30' },
  partial: { label: 'Started form', className: 'bg-amber-500/10 text-amber-300 border-amber-500/30' },
  contacted: { label: 'Contacted', className: 'bg-violet-500/10 text-violet-300 border-violet-500/30' },
};

export const STATUS_OPTIONS = Object.entries(STATUS).map(([value, s]) => ({ value, label: s.label }));

export function ContactStatus({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status.replace(/_/g, ' ') || 'New', className: 'bg-gray-700/40 text-gray-300 border-gray-600' };
  return <span className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold ${s.className}`}>{s.label}</span>;
}

const FIT_STYLES: Record<LeadFit, string> = {
  strong: 'text-[#FF9A66] border-[#F46325]/50 bg-[#F46325]/10',
  possible: 'text-gray-300 border-gray-600',
  early: 'text-gray-500 border-gray-700',
  not_a_lead: 'text-red-300/80 border-red-500/30',
};

export function FitBadge({ fit }: { fit?: string | null }) {
  if (!fit || !(fit in FIT_STYLES)) return null;
  return (
    <span className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold ${FIT_STYLES[fit as LeadFit]}`}>
      {fit === 'strong' ? '★ ' : ''}
      {LEAD_FIT_LABELS[fit as LeadFit].replace(' (vendor/spam)', '')}
    </span>
  );
}

export function recipientFor(c: { id: string; name: string; email: string; business_name: string | null; completion_status: string }): Recipient {
  return { name: c.name, email: c.email, businessName: c.business_name ?? '', source: 'contact', sourceId: c.id, paid: c.completion_status === 'paid' };
}
