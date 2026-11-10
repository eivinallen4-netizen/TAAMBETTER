import Reveal from '@/components/editorial/Reveal';

export interface Testimonial {
  /** Their words, with a result in them. Real quotes only. */
  quote: string;
  name: string;
  business: string;
}

/**
 * Named client quotes, straight under the offer so the proof sits next to the ask.
 * Renders nothing until there are real quotes to show.
 */
export default function TestimonialsSection({ quotes }: { quotes: Testimonial[] }) {
  if (quotes.length === 0) return null;

  return (
    <section aria-label="What clients say" className="tone-ink relative gutter pb-[calc(var(--section-pad)*0.6)]">
      <p className="eyebrow mb-8 text-[color:var(--tone-muted)]">In their words</p>
      <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {quotes.map((t, i) => (
          <Reveal
            key={t.name}
            as="li"
            delay={i * 0.06}
            className="flex flex-col justify-between gap-8 rounded-[var(--radius-card)] border-2 rule p-6 md:p-8"
          >
            <blockquote className="text-lg md:text-xl font-bold leading-snug">&ldquo;{t.quote}&rdquo;</blockquote>
            <p className="eyebrow text-[color:var(--tone-muted)]">
              {t.name} · {t.business}
            </p>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
