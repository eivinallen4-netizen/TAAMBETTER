import Headline from '@/components/editorial/Headline';
import Mascot from '@/components/editorial/Mascot';
import Reveal from '@/components/editorial/Reveal';
import Section, { type Tone } from '@/components/editorial/Section';

interface Stat {
  value: string;
  label: string;
}

interface ManifestoSectionProps {
  statement: string;
  description: string;
  stats: Stat[];
  tone?: Tone;
  index?: string;
  label?: string;
}

/** Outlined statement on the left, copy pushed off-axis to the right, then oversized numbers. */
export default function ManifestoSection({
  statement,
  description,
  stats,
  tone = 'ink',
  index = '01',
  label = 'Manifesto',
}: ManifestoSectionProps) {
  return (
    <Section tone={tone} index={index} label={label}>
      <div className="grid grid-cols-12 gap-x-6 gap-y-12">
        <Headline text={statement} outlineFrom={1} className="display-lg col-span-12" />
        <Reveal className="col-span-12 md:col-span-7 md:col-start-6 lg:col-span-4 lg:col-start-9">
          <p className="lede text-[color:var(--tone-muted)]">{description}</p>
        </Reveal>
      </div>

      <dl className="relative mt-24 md:mt-36 grid grid-cols-2 lg:grid-cols-4 border-t rule">
        {/* Kicking back, sat on the rule above the numbers with his legs hanging over. */}
        <Reveal className="absolute z-10 bottom-full right-0 w-32 md:w-44">
          <Mascot pose="chill" size={176} className="w-full h-auto translate-y-[36%]" />
        </Reveal>
        {stats.map((stat, i) => (
          <Reveal
            key={stat.label}
            delay={i * 0.08}
            className={`pt-8 pb-2 pr-4 ${i % 2 ? 'pl-4 lg:pl-8 border-l rule' : i > 0 ? 'lg:pl-8 lg:border-l rule' : ''}`}
          >
            <dt className="eyebrow mb-4 text-[color:var(--tone-muted)]">{stat.label}</dt>
            <dd className="display text-[clamp(3.5rem,8vw,8.5rem)]">{stat.value}</dd>
          </Reveal>
        ))}
      </dl>
    </Section>
  );
}
