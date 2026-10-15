'use client';

import Image from 'next/image';
import { useEffect, useRef, type ReactNode } from 'react';
import { animate, motion, useInView, useReducedMotion, useScroll, useTransform } from 'motion/react';
import ContactCTA from '@/app/components/ContactCTA';
import LoopVideo from '@/components/editorial/LoopVideo';

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

const EASE = [0.16, 1, 0.3, 1] as const;

/** Timeline (seconds after mount): lines rise, then the strike, then the outlined lines fill solid. */
const T = { rise: 0.15, strike: 1.0, fill: 1.45, pill: 1.3, rest: 1.6 };

function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const match = value.match(/^([^\d]*)([\d.]+)(.*)$/);

  useEffect(() => {
    if (!match || !inView || reduce || !ref.current) return;
    const [, pre, num, post] = match;
    const target = parseFloat(num);
    const el = ref.current;
    el.textContent = `${pre}0${post}`;
    const controls = animate(0, target, {
      duration: 1.6,
      delay: T.rest,
      ease: EASE,
      onUpdate: (v) => {
        el.textContent = `${pre}${Number.isInteger(target) ? Math.round(v) : v.toFixed(1)}${post}`;
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, value]);

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
      <span className="talk-badge-core" aria-hidden="true">↗</span>
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
  const reduce = !!useReducedMotion();
  const lines = title.split('\n');

  const reelRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: reelRef, offset: ['start end', 'start 0.15'] });
  const reelScale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0.82, 1]);
  const reelImgY = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-8%', '0%']);

  const play = !reduce;

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
            <motion.span
              aria-hidden="true"
              className="strike-bar"
              initial={play ? { scaleX: 0 } : false}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.7, delay: T.strike, ease: EASE }}
            />
          </span>
        </>
      );
    }

    if (isFill) {
      content = (
        <span className="relative inline-block">
          <span className="outline-type">{text}</span>
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 text-white [-webkit-text-stroke:clamp(2px,0.28vw,5px)_white] [paint-order:stroke_fill]"
            initial={play ? { clipPath: 'inset(-10% 100% -10% 0)' } : false}
            animate={{ clipPath: 'inset(-10% -5% -10% -5%)' }}
            transition={{ duration: 1.1, delay: T.fill + (i - fillFrom) * 0.18, ease: EASE }}
          >
            {text}
          </motion.span>
        </span>
      );
    }

    return (
      <span key={i} aria-hidden="true" className="flex items-center gap-[0.18em] [overflow-y:clip] pb-[0.06em] -mb-[0.06em]">
        <motion.span
          className="block shrink-0"
          initial={play ? { y: '105%' } : false}
          animate={{ y: '0%' }}
          transition={{ duration: 1.1, delay: T.rise + 0.08 * i, ease: EASE }}
        >
          {content}
        </motion.span>
        {isLast && (
          <motion.span
            className="hero-pill hidden sm:block"
            initial={play ? { clipPath: 'inset(0 100% 0 0 round 999px)' } : false}
            animate={{ clipPath: 'inset(0 0% 0 0 round 999px)' }}
            transition={{ duration: 1.2, delay: T.pill, ease: EASE }}
          >
            <Image src={image.src} alt="" fill priority sizes="60vw" className="object-cover" style={{ objectPosition: "center 30%" }} />
            {image.video && <LoopVideo src={image.video} poster={image.src} position="center 30%" />}
            <span className="hero-pill-label">
              <span className="live-dot" /> {pillLabel}
            </span>
          </motion.span>
        )}
      </span>
    );
  };

  const fade = (delay: number) =>
    play ? { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, delay, ease: EASE } } : {};

  return (
    <section className="tone-orange relative overflow-clip">
      <div className="gutter flex min-h-svh flex-col pt-28 md:pt-32 pb-8 md:pb-10">
        <motion.div className="flex items-baseline justify-between gap-6" {...fade(0.05)}>
          <p className="eyebrow">Content marketing agency</p>
          <p className="eyebrow hidden sm:block">Las Vegas, NV</p>
        </motion.div>

        <div className="relative my-auto py-10 md:py-12">
          <h1 className="display hero-type" aria-label={lines.join(' ')}>
            {lines.map(renderLine)}
          </h1>
          <motion.div
            className="absolute right-0 top-[8%] hidden lg:block"
            initial={play ? { scale: 0, rotate: -90 } : false}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: T.rest + 0.2, ease: EASE }}
          >
            <TalkBadge />
          </motion.div>
        </div>

        <div className="grid grid-cols-12 gap-x-6 gap-y-8 items-end border-t rule pt-6 md:pt-8">
          <motion.p className="col-span-12 md:col-span-6 lg:col-span-4 font-medium leading-relaxed text-[0.98rem] md:text-[1.05rem]" {...fade(T.rest)}>
            {subtitle}
          </motion.p>
          <motion.div className="col-span-12 md:col-span-6 lg:col-span-4 flex flex-wrap gap-3 md:justify-end lg:justify-start" {...fade(T.rest + 0.1)}>
            {actions}
          </motion.div>
          <motion.dl className="col-span-12 lg:col-span-4 grid grid-cols-3 gap-4" {...fade(T.rest + 0.2)}>
            {stats.slice(0, 3).map((s) => (
              <div key={s.label} className="flex flex-col">
                <dt className="eyebrow text-[0.62rem] mt-1 order-2 text-[color:var(--tone-muted)]">{s.label}</dt>
                <dd className="display text-[clamp(1.9rem,3.2vw,3.25rem)] leading-none order-1 tabular-nums">
                  <CountUp value={s.value} />
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>
      </div>

      {/* The reel: starts inset, opens to full width as it scrolls up. */}
      <div ref={reelRef} className="gutter pb-[var(--gutter)]">
        <motion.div style={{ scale: reelScale }} className="media-card aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9] origin-top">
          <motion.div style={{ y: reelImgY }} className="absolute inset-[-8%_0]">
            <Image src={image.src} alt={image.alt} fill sizes="100vw" className="object-cover" style={{ objectPosition: image.position }} />
            {image.video && <LoopVideo src={image.video} poster={image.src} position={image.position} />}
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />
          {note && (
            <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-4 p-6 md:p-10">
              <span className="eyebrow">Latest result</span>
              <div className="text-base md:text-xl font-bold max-w-xl md:text-right">{note}</div>
            </div>
          )}
        </motion.div>
        {caption && <div className="mt-4 text-sm font-semibold leading-relaxed text-[color:var(--tone-muted)]">{caption}</div>}
      </div>
    </section>
  );
}
