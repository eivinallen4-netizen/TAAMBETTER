import { STATUS_LABELS, type OnboardingStatus } from '@/app/lib/onboarding';

const STYLES: Record<string, string> = {
  sent: 'bg-gray-700/60 text-gray-300',
  opened: 'bg-sky-500/15 text-sky-300',
  in_progress: 'bg-amber-500/15 text-amber-300',
  submitted: 'bg-[#F46325]/20 text-[#FF9A66]',
  complete: 'bg-emerald-500/15 text-emerald-300',
  new: 'bg-[#F46325]/20 text-[#FF9A66]',
  completed: 'bg-emerald-500/15 text-emerald-300',
  partial: 'bg-amber-500/15 text-amber-300',
  pending: 'bg-amber-500/15 text-amber-300',
  contacted: 'bg-sky-500/15 text-sky-300',
};

export function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status as OnboardingStatus] ?? status.replace(/_/g, ' ');
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${STYLES[status] ?? 'bg-gray-700/60 text-gray-300'}`}>
      {label || '—'}
    </span>
  );
}
