import type { CheckStatus } from '@/app/lib/tool-types';

const marks: Record<CheckStatus, { glyph: string; label: string; className: string }> = {
  pass: { glyph: '✓', label: 'Pass', className: 'bg-white text-taam-near-black' },
  warn: { glyph: '!', label: 'Needs work', className: 'shadow-[inset_0_0_0_2px_rgba(255,255,255,0.7)]' },
  fail: { glyph: '✕', label: 'Fail', className: 'bg-taam-orange text-white' },
};

/** Pass / warn / fail without leaving the orange-ink-white palette: filled, outlined, orange. */
export default function StatusMark({ status }: { status: CheckStatus }) {
  const m = marks[status];
  return (
    <span
      role="img"
      aria-label={m.label}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${m.className}`}
    >
      {m.glyph}
    </span>
  );
}
