import type { ReactNode } from 'react';
import Headline from '@/components/editorial/Headline';
import MediaCard from '@/components/editorial/MediaCard';
import Reveal from '@/components/editorial/Reveal';
import type { Tone } from '@/components/editorial/Section';

interface PageHeroProps {
  eyebrow: string;
  title: string;
  /** Lines from this index onward are outlined. */
  outlineFrom?: number;
  subtitle?: string;
  image?: { src: string; alt: string; position?: string; video?: string };
  tone?: Tone;
  size?: 'xl' | 'lg';
  actions?: ReactNode;
  /** Small print under the actions (proof point, who it's for). */
  note?: ReactNode;
  /** Extra content between the copy split and the image (e.g. results). */
  children?: ReactNode;
}

/** Poster-style page opener: oversized headline sets the layout, copy sits off-axis, then a cinematic card. */
export default function PageHero({
  eyebrow,
  title,
  outlineFrom,
  subtitle,
  image,
  tone = 'orange',
  size = 'xl',
  actions,
  note,
  children,
}: PageHeroProps) {
  return (
    <section className={`tone-${tone} relative overflow-clip`}>
      <div className="gutter pt-32 md:pt-40 pb-[var(--gutter)]">
        <div className="flex items-baseline justify-between gap-6 mb-10 md:mb-14">
          <p className="eyebrow">{eyebrow}</p>
          <p className="eyebrow hidden sm:block">Las Vegas, NV</p>
        </div>

        <Headline
          as="h1"
          immediate
          text={title}
          outlineFrom={outlineFrom}
          className={size === 'xl' ? 'text-[10.6vw] md:text-[11.6vw] 2xl:text-[min(11.6vw,15rem)]' : 'display-lg'}
        />

        {(subtitle || actions) && (
          <div className="grid grid-cols-12 gap-6 mt-14 md:mt-20">
            <Reveal className="col-span-12 md:col-span-6 md:col-start-7 lg:col-span-4 lg:col-start-8" delay={0.4}>
              {subtitle && <p className="lede">{subtitle}</p>}
              {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
              {note && <div className="mt-6 text-sm font-semibold leading-relaxed">{note}</div>}
            </Reveal>
          </div>
        )}

        {children}

        {image && (
          <Reveal className="mt-16 md:mt-24" delay={0.2} y={60}>
            <MediaCard
              src={image.src}
              video={image.video}
              alt={image.alt}
              priority
              aspect="aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]"
              position={image.position}
            />
          </Reveal>
        )}
      </div>
    </section>
  );
}
