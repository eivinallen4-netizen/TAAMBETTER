'use client';

import Image from 'next/image';
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import HalftoneField from '@/components/editorial/HalftoneField';
import LoopVideo from '@/components/editorial/LoopVideo';
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
  /** Label pinned to the top of the video card. */
  pillLabel?: string;
  /** Credit line for the footage, shown beside the stats. */
  caption?: ReactNode;
  stats: Stat[];
  actions: ReactNode;
  /** Proof card stuck onto the bottom of the video card (e.g. the latest case-study result). */
  proof?: ReactNode;
  /** Top-left eyebrow (shown on every screen size, so it carries the audience). */
  eyebrow?: string;
  /** Top-right eyebrow, hidden on phones. */
  eyebrowRight?: string;
}

/** Close match for the site's cubic-bezier(0.16, 1, 0.3, 1). */
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Timeline (seconds after first paint): lines rise, then the strike, then the outlined lines fill solid. */
const T = { rise: 0, strike: 0.6, fill: 0.7, card: 0.25, rest: 0.5 };

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

/**
 * Homepage opener, split in two: the promise and the ask on the left, the footage on the right
 * with the latest result stuck onto it like a sticker. The numbers and the footage credit run
 * along the bottom rule. Everything fits the first screen on a laptop.
 */
export default function HomeHero({
  title,
  strikeLine,
  fillFrom = 2,
  subtitle,
  image,
  stats,
  actions,
  proof,
  pillLabel = 'On set, Las Vegas',
  caption,
  eyebrow = 'Content marketing agency',
  eyebrowRight = 'Las Vegas, NV',
}: HomeHeroProps) {
  const lines = title.split('\n');

  const renderLine = (text: string, i: number) => {
    const isFill = i >= fillFrom;
    const isStrike = i === strikeLine;

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
      <span key={i} aria-hidden="true" className="block [overflow-y:clip] pb-[0.06em] -mb-[0.06em]">
        <span className="enter-rise block" style={d(T.rise + 0.06 * i)}>
          {content}
        </span>
      </span>
    );
  };

  return (
    <section className="tone-orange relative isolate overflow-clip">
      <HalftoneField />
      {/* Extra bottom room: the tilted ribbon below overlaps this section's last ~5rem. */}
      <div className="gutter flex min-h-svh flex-col pt-28 md:pt-32 pb-20 md:pb-28">
        <div className="enter-fade flex items-baseline justify-between gap-6" style={d(0.05)}>
          <p className="eyebrow">{eyebrow}</p>
          <p className="eyebrow hidden sm:block">{eyebrowRight}</p>
        </div>

        <div className="my-auto grid grid-cols-12 items-center gap-x-6 lg:gap-x-14 gap-y-12 py-10 md:py-12 lg:py-8">
          {/* The promise and the ask. */}
          <div className="col-span-12 lg:col-span-7">
            <h1 className="display hero-type" aria-label={lines.join(' ')}>
              {lines.map(renderLine)}
            </h1>
            <p
              className="enter-fade mt-8 md:mt-10 max-w-xl font-medium leading-relaxed text-[0.98rem] md:text-[1.1rem]"
              style={d(T.rest)}
            >
              {subtitle}
            </p>
            <div
              className="enter-fade mt-7 flex flex-col sm:flex-row sm:items-center lg:flex-col lg:items-start xl:flex-row xl:items-center gap-x-6 gap-y-3"
              style={d(T.rest + 0.1)}
            >
              {actions}
            </div>
          </div>

          {/* The footage, with the latest result stuck onto it. */}
          <div className="enter-fade relative col-span-12 sm:col-span-10 sm:col-start-2 md:col-span-8 md:col-start-3 lg:col-span-5 lg:col-start-8" style={d(T.card)}>
            {/* Pinned right on desktop; the card's width follows its height (see .hero-card). */}
            <div className="relative lg:ml-auto lg:w-fit">
              <div className="media-card hero-card aspect-[4/5] bg-black">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-cover"
                  style={{ objectPosition: image.position }}
                />
                {image.video && <LoopVideo src={image.video} position={image.position} />}
                <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/45" aria-hidden="true" />
                <span className="hero-pill-label hero-card-label">
                  <span className="live-dot" /> {pillLabel}
                </span>
              </div>
              {proof && <div className="hero-sticker">{proof}</div>}
            </div>
          </div>
        </div>

        {/* The numbers and the footage credit, along the bottom rule. */}
        <div className="enter-fade grid grid-cols-12 items-end gap-x-6 gap-y-6 border-t rule pt-6 md:pt-8" style={d(T.rest + 0.2)}>
          <dl className="col-span-12 lg:col-span-6 grid grid-cols-3 gap-4">
            {stats.slice(0, 3).map((s) => (
              <div key={s.label} className="flex flex-col">
                <dt className="eyebrow text-[0.62rem] mt-1 order-2 text-[color:var(--tone-muted)]">{s.label}</dt>
                <dd className="display text-[clamp(1.9rem,3.2vw,3.25rem)] leading-none order-1 tabular-nums">
                  <CountUp value={s.value} />
                </dd>
              </div>
            ))}
          </dl>
          {caption && (
            <div className="col-span-12 lg:col-span-5 lg:col-start-8 text-sm font-semibold leading-relaxed text-[color:var(--tone-muted)]">
              {caption}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
