import ContactCTA from '@/app/components/ContactCTA';
import Headline from '@/components/editorial/Headline';
import Reveal from '@/components/editorial/Reveal';
import Section, { type Tone } from '@/components/editorial/Section';
import Arrow from '@/components/editorial/Arrow';

interface OfferTerm {
  label: string;
  value: string;
  detail: string;
}

interface OfferSectionProps {
  terms: OfferTerm[];
  ctaLabel: string;
  /** What we promise, and what we add on top. Both are work we do, never money off. */
  guarantee?: string;
  bonus?: string;
  /** A real capacity limit, shown beside the button. */
  capacity?: string;
  tone?: Tone;
  index?: string;
}

/**
 * The named offer, straight under the hero: what you get, what it costs, how fast and what you're
 * signing up for. Answers the price / timing / commitment questions before anyone has to ask.
 */
export default function OfferSection({ terms, ctaLabel, guarantee, bonus, capacity, tone = 'ink', index = '01' }: OfferSectionProps) {
  const extras = [
    guarantee && { label: 'The guarantee', text: guarantee },
    bonus && { label: 'Bonus', text: bonus },
  ].filter(Boolean) as { label: string; text: string }[];

  return (
    <Section tone={tone} index={index} label="The offer">
      <div className="grid grid-cols-12 gap-x-6 gap-y-8 mb-14 md:mb-20">
        <Headline text={'The 30-video\nmonth.'} outlineFrom={1} className="display-lg col-span-12 md:col-span-7" />
        <Reveal className="col-span-12 md:col-span-5 lg:col-span-4 lg:col-start-9 self-end">
          <p className="lede text-[color:var(--tone-muted)]">
            One Las Vegas team plans it, films it at your business, edits it and posts it. You run the business and
            show up for the shoot.
          </p>
        </Reveal>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 border-t-2 rule">
        {terms.map((t, i) => (
          <Reveal
            key={t.label}
            delay={i * 0.06}
            className="border-b-2 rule py-8 sm:pr-6 xl:border-b-0 xl:py-10 xl:[&:not(:first-child)]:border-l-2 xl:[&:not(:first-child)]:pl-6"
          >
            <dt className="eyebrow text-[color:var(--tone-muted)]">{t.label}</dt>
            <dd className="mt-4">
              <span className="display block text-[clamp(2.2rem,7vw,3.2rem)] xl:text-[clamp(2rem,2.6vw,2.75rem)] leading-none">{t.value}</span>
              <span className="mt-4 block text-base md:text-lg leading-snug font-medium text-[color:var(--tone-muted)]">
                {t.detail}
              </span>
            </dd>
          </Reveal>
        ))}
      </dl>

      {extras.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b-2 xl:border-t-2 rule">
          {extras.map((x, i) => (
            <Reveal
              key={x.label}
              delay={i * 0.06}
              className="py-8 sm:pr-6 xl:py-10 [&:not(:first-child)]:border-t-2 sm:[&:not(:first-child)]:border-t-0 sm:[&:not(:first-child)]:border-l-2 sm:[&:not(:first-child)]:pl-6 rule"
            >
              <p className="eyebrow text-[color:var(--tone-muted)]">{x.label}</p>
              <p className="mt-4 text-xl md:text-2xl font-extrabold leading-snug">{x.text}</p>
            </Reveal>
          ))}
        </div>
      )}

      <Reveal className="mt-14 md:mt-20 flex flex-col sm:flex-row sm:items-center gap-x-10 gap-y-5">
        <ContactCTA className="btn btn-solid self-start">
          {ctaLabel} <Arrow />
        </ContactCTA>
        <p className="font-semibold text-[color:var(--tone-muted)]">
          {capacity ?? 'Two minutes. A real person replies within 1 business day.'}
        </p>
      </Reveal>
    </Section>
  );
}
