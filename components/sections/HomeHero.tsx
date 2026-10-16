'use client';

import Image from 'next/image';
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import ContactCTA from '@/app/components/ContactCTA';
import LoopVideo from '@/components/editorial/LoopVideo';
import Arrow from '@/components/editorial/Arrow';
import useInViewOnce from '@/components/editorial/useInViewOnce';

interface Stat {
  value: string;
  label: string;
}

interface HomeHeroProps {
  /** Lines separated by "\n". The last word of `strikeLine` (if set) gets struck out; lines from `fillFrom` start outlined and fill in. */
  title: string;
  strikeLine?: number;
  fillFrom?: number;
  subtitle: string;
  /** `src` is the still; `video` (optional) loops over it. */
  image: { src: string; alt: string; position?: string; video?: string };
  /** Pill label next to the last headline line. */
  pillLabel?: string;
  /** Credit line under the reel. */
  caption?: ReactNode;
  stats: Stat[];
  actions: ReactNode;
  /** Proof line laid over the reel (featured case study). */
  note?: ReactNode;
}

/** Close match for the site's cubic-bezier(0.16, 1, 0.3, 1). */
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Timeline (seconds after first paint): lines rise, then the strike, then the outlined lines fill solid. */
const T = { rise: 0, strike: 0.6, fill: 0.7, pill: 0.5, rest: 0.5 };

/** Delay for the CSS `.enter-*` entrances in globals.css. */
const d = (s: number) => ({ '--d': `${s}s` }) as CSSProperties;

function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInViewOnce(ref);

  useEffect(() => {
    const match = value.match(/^([^\d]*)([\d.]+)(.*)$/);
    if (!match || !inView || !ref.current || prefersReducedMotion()) return;
    const [, pre, num, post] = match;
    const target = parseFloat(num);
    const el = ref.current;
    const show = (v: number) => {
      el.textContent = `${pre}${Number.isInteger(target) ? Math.round(v) : v.toFixed(1)}${post}`;
    };
    show(0);
    const start = performance.now() + T.rest * 1000;
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.max(0, (now - start) / 1600);
      show(target * easeOutExpo(t));
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  return <span ref={ref}>{value}</span>;
}

/** Circular "let's talk" sticker that slowly spins; opens the contact form. */
function TalkBadge() {
  return (
    <ContactCTA className="talk-badge group">
      <svg viewBox="0 0 200 200" className="talk-badge-ring" aria-hidden="true">
        <defs>
          <path id="talk-ring" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <text className="fill-current text-[15px] font-extrabold uppercase">
          <textPath href="#talk-ring" textLength="486" lengthAdjust="spacing">Give us a call • Say wow • Give us a call • Say wow •</textPath>
        </text>
      </svg>
      <span className="talk-badge-core" aria-hidden="true"><Arrow /></span>
      <span className="sr-only">Give us a call</span>
    </ContactCTA>
  );
}

/**
 * Homepage opener. Fits the first screen: the promise rises in and its outlined lines fill solid,
 * with the ask and the proof visible before any scroll. Below, the cinematic reel opens up as you scroll.
 */
export default function HomeHero({
  title,
  strikeLine,
  fillFrom = 2,
  subtitle,
  image,
  stats,
  actions,
  note,
  pillLabel = 'On set, Las Vegas',
  caption,
}: HomeHeroProps) {
  const lines = title.split('\n');

  // The reel opens up as its top travels from the bottom of the viewport to 15% from the top.
  const reelRef = useRef<HTMLDivElement>(null);
  const reelCardRef = useRef<HTMLDivElement>(null);
  const reelImgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reel = reelRef.current;
    const card = reelCardRef.current;
    const img = reelImgRef.current;
    if (!reel || !card || !img || prefersReducedMotion()) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh - reel.getBoundingClientRect().top) / (vh * 0.85)));
      card.style.transform = `scale(${0.82 + 0.18 * p})`;
      img.style.transform = `translateY(${-8 * (1 - p)}%)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const renderLine = (text: string, i: number) => {
    const isFill = i >= fillFrom;
    const isStrike = i === strikeLine;
    const isLast = i === lines.length - 1;

    let content: ReactNode = text;
    if (isStrike) {
      const cut = text.lastIndexOf(' ');
      const head = cut >= 0 ? text.slice(0, cut + 1) : '';
      const word = cut >= 0 ? text.slice(cut + 1) : text;
      content = (
        <>
          {head}
          <span className="relative inline-block">
            {word}
            <span aria-hidden="true" className="strike-bar enter-strike" style={d(T.strike)} />
          </span>
        </>
      );
    }

    // The solid line sits underneath and the outlined copy wipes off it, so both layers paint
    // on the first frame. (Wiping the solid layer *in* made it the LCP element ~2.5s late.)
    if (isFill) {
      content = (
        <span className="relative inline-block">
          <span className="text-white [-webkit-text-stroke:clamp(2px,0.28vw,5px)_white] [paint-order:stroke_fill]">{text}</span>
          <span
            aria-hidden="true"
            className="outline-type enter-unfill absolute inset-0"
            style={d(T.fill + (i - fillFrom) * 0.12)}
          >
            {text}
          </span>
        </span>
      );
    }

    return (
      <span key={i} aria-hidden="true" className="flex items-center gap-[0.18em] [overflow-y:clip] pb-[0.06em] -mb-[0.06em]">
        <span className="enter-rise block shrink-0" style={d(T.rise + 0.06 * i)}>
          {content}
        </span>
        {isLast && (
          <span className="enter-pill hero-pill hidden sm:block" style={d(T.pill)}>
            <Image src={image.src} alt="" fill priority sizes="60vw" className="object-cover" style={{ objectPosition: "center 30%" }} />
            {image.video && <LoopVideo src={image.video} position="center 30%" />}
            <span className="hero-pill-label">
              <span className="live-dot" /> {pillLabel}
            </span>
          </span>
        )}
      </span>
    );
  };

  return (
    <section className="tone-orange relative overflow-clip">
      <div className="gutter flex min-h-svh flex-col pt-28 md:pt-32 pb-8 md:pb-10">
        <div className="enter-fade flex items-baseline justify-between gap-6" style={d(0.05)}>
          <p className="eyebrow">Content marketing agency</p>
          <p className="eyebrow hidden sm:block">Las Vegas, NV</p>
        </div>

        <div className="relative my-auto py-10 md:py-12">
          <h1 className="display hero-type" aria-label={lines.join(' ')}>
            {lines.map(renderLine)}
          </h1>
          <div className="enter-pop absolute right-0 top-[8%] hidden lg:block" style={d(T.rest + 0.2)}>
            <TalkBadge />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-x-6 gap-y-8 items-end border-t rule pt-6 md:pt-8">
          <p className="enter-fade col-span-12 md:col-span-6 lg:col-span-4 font-medium leading-relaxed text-[0.98rem] md:text-[1.05rem]" style={d(T.rest)}>
            {subtitle}
          </p>
          <div className="enter-fade col-span-12 md:col-span-6 lg:col-span-4 flex flex-wrap gap-3 md:justify-end lg:justify-start" style={d(T.rest + 0.1)}>
            {actions}
          </div>
          <dl className="enter-fade col-span-12 lg:col-span-4 grid grid-cols-3 gap-4" style={d(T.rest + 0.2)}>
            {stats.slice(0, 3).map((s) => (
              <div key={s.label} className="flex flex-col">
                <dt className="eyebrow text-[0.62rem] mt-1 order-2 text-[color:var(--tone-muted)]">{s.label}</dt>
                <dd className="display text-[clamp(1.9rem,3.2vw,3.25rem)] leading-none order-1 tabular-nums">
                  <CountUp value={s.value} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* The reel: starts inset, opens to full width as it scrolls up. */}
      <div ref={reelRef} className="gutter pb-[var(--gutter)]">
        <div ref={reelCardRef} className="media-card aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9] origin-top">
          <div ref={reelImgRef} className="absolute inset-[-8%_0]">
            <Image src={image.src} alt={image.alt} fill sizes="100vw" className="object-cover" style={{ objectPosition: image.position }} />
            {image.video && <LoopVideo src={image.video} position={image.position} />}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />
          {note && (
            <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-4 p-6 md:p-10">
              <span className="eyebrow">Latest result</span>
              <div className="text-base md:text-xl font-bold max-w-xl md:text-right">{note}</div>
            </div>
          )}
        </div>
        {caption && <div className="mt-4 text-sm font-semibold leading-relaxed text-[color:var(--tone-muted)]">{caption}</div>}
      </div>
    </section>
  );
}
