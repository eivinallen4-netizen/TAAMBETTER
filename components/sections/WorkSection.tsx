import Image from 'next/image';
import Link from 'next/link';
import ContactCTA from '@/app/components/ContactCTA';
import EdgeTitle from '@/components/editorial/EdgeTitle';
import LoopVideo from '@/components/editorial/LoopVideo';
import Mascot from '@/components/editorial/Mascot';
import MediaCard from '@/components/editorial/MediaCard';
import Reveal from '@/components/editorial/Reveal';
import Section, { type Tone } from '@/components/editorial/Section';
import Arrow from '@/components/editorial/Arrow';

interface Result {
  value: string;
  label: string;
  from?: string;
}

export interface WorkProject {
  id: number;
  title: string;
  category: string;
  image?: string;
  tagline?: string;
  results?: Result[];
  videos?: { src: string; title?: string }[];
}

interface WorkSectionProps {
  projects: WorkProject[];
  tone?: Tone;
  index?: string;
  /** Play the featured project's reels inline, so the proof doesn't take a click. */
  showReels?: boolean;
}

/** Featured case study: a full-bleed card, then title and hard numbers split asymmetrically. */
export default function WorkSection({ projects, tone = 'ink', index = '03', showReels = false }: WorkSectionProps) {
  const [featured, ...rest] = projects;
  if (!featured) return null;
  const reels = showReels ? (featured.videos ?? []).slice(0, 4) : [];

  return (
    <Section tone={tone} index={index} label="Selected work">
      <EdgeTitle className="mb-[-0.18em]">Work</EdgeTitle>

      <Reveal y={60}>
        <Link href={`/work/${featured.id}`} className="group block" aria-label={`Case study: ${featured.title}`}>
          {featured.image && (
            <MediaCard src={featured.image} alt={featured.title} aspect="aspect-[4/5] sm:aspect-[16/9]" scrim>
              <div className="flex h-full items-end justify-between p-6 md:p-10">
                <span className="eyebrow">{featured.category}</span>
                <span className="btn btn-solid">View case <Arrow /></span>
              </div>
            </MediaCard>
          )}
        </Link>
      </Reveal>

      <div className="grid grid-cols-12 gap-x-6 gap-y-12 mt-14 md:mt-20">
        <Reveal className="col-span-12 lg:col-span-5">
          <h3 className="display display-lg">{featured.title}</h3>
          {featured.tagline && <p className="lede mt-8 max-w-md text-[color:var(--tone-muted)]">{featured.tagline}</p>}
        </Reveal>

        {featured.results && (
          <dl className="relative col-span-12 lg:col-span-6 lg:col-start-7 grid grid-cols-2 gap-x-6 gap-y-10 self-end">
            {/* Trophy for the numbers: under them on small screens, perched on the top rule on desktop. */}
            <Reveal className="order-last col-span-2 justify-self-end w-24 md:w-28 lg:absolute lg:bottom-full lg:right-0 lg:mb-[-2px]">
              <Mascot pose="famous" size={144} className="mascot-bob w-full h-auto" />
            </Reveal>
            {featured.results.map((r, i) => (
              <Reveal key={r.label} delay={i * 0.08} className="border-t rule pt-5 flex flex-col">
                <dt className="eyebrow mt-3 order-2">{r.label}</dt>
                <dd className="display text-[clamp(2.75rem,5.5vw,5.5rem)] outline-type order-1">{r.value}</dd>
                {r.from && <dd className="text-sm mt-1 order-3 text-[color:var(--tone-muted)]">{r.from}</dd>}
              </Reveal>
            ))}
          </dl>
        )}
      </div>

      {reels.length > 0 && (
        <div className="mt-20 md:mt-28">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
            <p className="eyebrow">The actual reels. Sound off, all organic.</p>
            <Link href={`/work/${featured.id}`} className="eyebrow link-line">Full case study <Arrow /></Link>
          </div>
          <div className="-mx-[var(--gutter)] px-[var(--gutter)] flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 md:mx-0 md:px-0 md:grid md:grid-cols-4 md:overflow-visible">
            {reels.map((v, i) => (
              <Reveal key={v.src} delay={i * 0.08} className="snap-start shrink-0 w-[62vw] sm:w-[40vw] md:w-auto">
                <div className="media-card aspect-[9/16] bg-white/5">
                  {featured.image && (
                    <Image src={featured.image} alt="" fill sizes="(min-width: 768px) 25vw, 62vw" className="object-cover opacity-60" />
                  )}
                  <LoopVideo src={v.src} />
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal className="relative mt-12 flex flex-col sm:flex-row sm:items-center gap-x-10 gap-y-5">
            <ContactCTA className="btn btn-solid self-start">
              Want this for your business? <Arrow />
            </ContactCTA>
            <p className="font-semibold text-[color:var(--tone-muted)]">
              Same team, same process. About two minutes to tell us about yours.
            </p>
            <Mascot pose="money-gun" size={176} className="mascot-bob hidden md:block ml-auto w-36 lg:w-44 h-auto" />
          </Reveal>
        </div>
      )}

      {rest.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-20">
          {rest.slice(0, 4).map((p, i) => (
            <Reveal key={p.id} delay={i * 0.08}>
              <Link href={`/work/${p.id}`} className="group block">
                {p.image && <MediaCard src={p.image} alt={p.title} aspect="aspect-[4/3]" sizes="(min-width: 768px) 50vw, 100vw" />}
                <p className="eyebrow mt-5 text-[color:var(--tone-muted)]">{p.category}</p>
                <h3 className="display display-sm mt-2">{p.title}</h3>
              </Link>
            </Reveal>
          ))}
        </div>
      )}

      <div className="mt-20 flex justify-end">
        <Link href="/work" className="eyebrow link-line">All work <Arrow /></Link>
      </div>
    </Section>
  );
}
