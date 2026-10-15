import type { ReactNode } from 'react';

export type Tone = 'orange' | 'ink';

interface SectionProps {
  children: ReactNode;
  tone: Tone;
  /** Vertical title set in the left edge rail on desktop; a horizontal eyebrow on mobile. */
  label?: string;
  index?: string;
  id?: string;
  className?: string;
  /** Skip the default vertical padding (for sections that manage their own rhythm). */
  flush?: boolean;
}

/** A full-bleed color field. Sections alternate brand orange and near-black, type stays white. */
export default function Section({ children, tone, label, index, id, className = '', flush = false }: SectionProps) {
  const caption = [index, label].filter(Boolean).join(' — ');

  return (
    <section id={id} className={`tone-${tone} relative overflow-clip ${className}`}>
      {caption && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 hidden md:flex w-[var(--gutter)] items-start justify-center pt-[var(--section-pad)]"
        >
          <span className="vertical-title eyebrow opacity-80">{caption}</span>
        </div>
      )}
      <div className={`gutter relative ${flush ? '' : 'section-pad'}`}>
        {caption && <p className="eyebrow mb-10 opacity-80 md:hidden">{caption}</p>}
        {children}
      </div>
    </section>
  );
}
