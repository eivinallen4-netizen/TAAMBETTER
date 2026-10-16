import type { CSSProperties, ReactNode } from 'react';
import Headline from '@/components/editorial/Headline';
import MediaCard from '@/components/editorial/MediaCard';
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
            <div className="enter-fade col-span-12 md:col-span-6 md:col-start-7 lg:col-span-4 lg:col-start-8" style={{ '--d': '0.3s' } as CSSProperties}>
              {subtitle && <p className="lede">{subtitle}</p>}
              {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
              {note && <div className="mt-6 text-sm font-semibold leading-relaxed">{note}</div>}
            </div>
          </div>
        )}

        {children}

        {image && (
          <div className="enter-fade mt-16 md:mt-24" style={{ '--d': '0.2s' } as CSSProperties}>
            <MediaCard
              src={image.src}
              video={image.video}
              alt={image.alt}
              priority
              aspect="aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]"
              position={image.position}
            />
          </div>
        )}
      </div>
    </section>
  );
}
