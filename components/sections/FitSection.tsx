import Link from 'next/link';
import ContactCTA from '@/app/components/ContactCTA';
import Headline from '@/components/editorial/Headline';
import Mascot from '@/components/editorial/Mascot';
import Reveal from '@/components/editorial/Reveal';
import Section, { type Tone } from '@/components/editorial/Section';

interface FitSectionProps {
  goodFit?: string[];
  notFit?: string[];
  tone?: Tone;
  index?: string;
}

const defaultGoodFit = [
  "You're already great at what you do. Not enough of the right people know it yet.",
  "You've had the same agency for years, and the results stopped moving a long time ago.",
  'Social media got handed to someone on your team as a side job, and it shows.',
  "You're ready to invest in marketing every month, not test the waters with a one-off post.",
  "You're happy to put your people and your work on camera.",
  'You judge marketing by calls, leads and sales, not likes alone.',
];

const defaultNotFit = [
  "You haven't opened yet and are still working out what you sell.",
  "You're shopping for the cheapest posting package in town.",
  'You need results in two weeks. Content compounds, and it takes a few months to show what it can do.',
  'You want someone to post what they are told, with no strategy behind it.',
];

/** Self-qualification: who we're built for, who we're not, so the right people raise their hand. */
export default function FitSection({
  goodFit = defaultGoodFit,
  notFit = defaultNotFit,
  tone = 'orange',
  index = '02',
}: FitSectionProps) {
  return (
    <Section tone={tone} index={index} label="Is this you?">
      <div className="grid grid-cols-12 gap-x-6 gap-y-10 mb-20 md:mb-28">
        <Headline text={'Built for\nthe best.'} outlineFrom={1} className="display-xl col-span-12 md:col-span-7" />
        <Reveal className="col-span-12 md:col-span-5 lg:col-span-4 lg:col-start-9 self-end">
          <p className="lede">
            Better marketing for the best businesses. If the first list sounds like you, we should talk. If it
            doesn&apos;t, call anyway. We&apos;ll point you to someone who fits.
          </p>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-16">
        <FitList title="A good fit if" items={goodFit} mark="✓" peek />
        <FitList title="Probably not if" items={notFit} mark="✕" muted />
      </div>

      <Reveal className="mt-20 md:mt-28 flex flex-col sm:flex-row sm:items-center gap-x-10 gap-y-6">
        <ContactCTA className="btn btn-solid self-start">
          Sounds like us. Let&apos;s talk <span aria-hidden="true">↗</span>
        </ContactCTA>
        <p className="font-semibold">
          Not ready for a retainer?{' '}
          <Link href="/tools" className="link-line">
            Check your site free
          </Link>
          . Already open and selling?{' '}
          <Link href="/free-video-offer" className="link-line">
            Get a free week of video ↗
          </Link>
        </p>
      </Reveal>
    </Section>
  );
}

function FitList({ title, items, mark, muted = false, peek = false }: { title: string; items: string[]; mark: string; muted?: boolean; peek?: boolean }) {
  return (
    <div>
      <div className="relative pb-8">
        <h3 className="display display-sm">{title}</h3>
        {/* Peeks up over the top rule of the list. */}
        {peek && (
          <Reveal y={30} className="absolute bottom-0 right-4 w-24 md:w-32">
            <Mascot pose="peek" size={144} className="w-full h-auto" />
          </Reveal>
        )}
      </div>
      <ul className="border-t-2 rule">
        {items.map((item, i) => (
          <Reveal as="li" key={item} delay={i * 0.05} className="flex gap-5 border-b-2 rule py-6">
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                muted ? 'shadow-[inset_0_0_0_2px_rgba(255,255,255,0.6)]' : 'bg-white text-taam-near-black'
              }`}
            >
              {mark}
            </span>
            <span className={`text-lg leading-snug font-medium ${muted ? 'text-[color:var(--tone-muted)]' : ''}`}>
              {item}
            </span>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
