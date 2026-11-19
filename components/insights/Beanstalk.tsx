'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

/** Width of the whole drawing; the stem runs down its centre. */
const WIDTH = 240;
const CENTER = WIDTH / 2;
/** Stem width, outline to outline. Art that includes the stem is scaled so the two match. */
const STEM = 26;
const LINE = 4;
const half = STEM / 2;
/** One repeat of the stem (two knuckles). */
const TILE = 96;

/**
 * Cut-out art: [file, intrinsic width, intrinsic height, rendered width, where its own stem sits (0–1 across)].
 * Art without a stem (the goose in flight, the ground scene) has no fifth value.
 */
const ART = {
  castle: ['castle', 650, 644, 230],
  climb: ['climb', 574, 700, 162, 0.694],
  slide: ['slide', 461, 700, 135, 0.485],
  scared: ['scared', 496, 700, 130, 0.388],
  hang: ['hang', 607, 700, 157, 0.523],
  tangled: ['tangled', 678, 700, 173, 0.504],
  dive: ['dive', 352, 700, 72],
  honk: ['honk', 700, 604, 150],
  win: ['win', 334, 700, 74],
  beans: ['beans', 700, 529, 104],
} as const;

type ArtName = keyof typeof ART;

function size(name: ArtName) {
  const [, w, h, width] = ART[name];
  return { width, height: (width * h) / w };
}

function Art({ name }: { name: ArtName }) {
  const [file, w, h] = ART[name];
  const { width, height } = size(name);
  return (
    <Image
      src={`/insights/art/${file}.webp`}
      alt=""
      width={w}
      height={h}
      sizes={`${width}px`}
      draggable={false}
      className="block max-w-none"
      style={{ width, height }}
    />
  );
}

/** Art that has the stem drawn through it, laid over the real stem so the two line up. `y` is its middle. */
function OnStem({ name, y }: { name: ArtName; y: number }) {
  const { width, height } = size(name);
  const stemAt = ART[name][4] ?? 0.5;
  return (
    <div className="absolute z-10" style={{ top: y - height / 2, left: CENTER - width * stemAt }}>
      <Art name={name} />
    </div>
  );
}

/** The goose in flight. Diving, it comes straight down the stem; otherwise it flaps tight against one side. `y` is its middle. */
function Beside({ name, y, left }: { name: ArtName; y: number; left: boolean }) {
  const { width, height } = size(name);
  const x = name === 'dive' ? CENTER - width / 2 : left ? CENTER - width + 24 : CENTER - 24;
  return (
    <div className="absolute z-10" style={{ top: y - height / 2, left: x, transform: left ? undefined : 'scaleX(-1)' }}>
      <Art name={name} />
    </div>
  );
}

/** A leaf growing out of the stem on a short stalk. `y` is where it joins the stem. */
function Leaf({ y, left, width = 96 }: { y: number; left: boolean; width?: number }) {
  const height = (width * 70) / 130;
  return (
    <svg
      viewBox="0 0 130 70"
      width={width}
      height={height}
      className="absolute block overflow-visible"
      style={{ top: y - height * 0.72, left: left ? CENTER - half + 3 - width : CENTER + half - 3, transform: left ? 'scaleX(-1)' : undefined }}
    >
      {/* stalk, drawn as a white stroke with a dark edge so it reads as part of the stem */}
      <path d="M-2 50 C8 50 14 46 22 42" fill="none" stroke="#111" strokeWidth={15} />
      <path d="M-2 50 C8 50 14 46 22 42" fill="none" stroke="#fff" strokeWidth={8} />
      <path
        d="M18 44 C30 18 62 4 96 6 C110 7 122 12 128 20 C116 46 84 64 52 60 C36 58 24 52 18 44 Z"
        fill="#fff"
        stroke="#111"
        strokeWidth={LINE + 1}
        strokeLinejoin="round"
      />
      <path d="M22 43 C54 40 92 30 122 21" fill="none" stroke="#111" strokeWidth={LINE} strokeLinecap="round" />
      <path d="M50 39 L58 22 M76 33 L86 17 M62 37 L68 50 M88 29 L98 40" fill="none" stroke="#111" strokeWidth={3} strokeLinecap="round" />
    </svg>
  );
}

/** A curly tendril growing out of the stem. `y` is where it joins. */
function Tendril({ y, left }: { y: number; left: boolean }) {
  return (
    <svg
      viewBox="0 0 60 44"
      width={54}
      height={40}
      className="absolute block overflow-visible"
      style={{ top: y - 28, left: left ? CENTER - half + 2 - 54 : CENTER + half - 2, transform: left ? 'scaleX(-1)' : undefined }}
    >
      <path
        d="M-2 30 C14 30 26 20 34 14 C44 6 56 12 54 22 C52 31 40 32 38 24 C37 19 42 16 46 19"
        fill="none"
        stroke="#fff"
        strokeWidth={5}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The stem as a repeating tile: a white tube with a knuckle on alternating sides. */
const STEM_TILE = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='${STEM}' height='${TILE}' viewBox='0 0 ${STEM} ${TILE}'>` +
    `<rect x='${LINE / 2}' y='-4' width='${STEM - LINE}' height='${TILE + 8}' fill='#fff' stroke='#111' stroke-width='${LINE}'/>` +
    `<path d='M${LINE} ${TILE * 0.25} q${half * 0.7} 9 ${half} 1' fill='none' stroke='#111' stroke-width='3' stroke-linecap='round'/>` +
    `<path d='M${STEM - LINE} ${TILE * 0.75} q${-half * 0.7} 9 ${-half} 1' fill='none' stroke='#111' stroke-width='3' stroke-linecap='round'/>` +
    `</svg>`
)}")`;

/** The chase, one moment per panel: the goose above, the mascot fleeing just below it. */
const CHASE: { goose: ArtName; runner: ArtName }[] = [
  { goose: 'dive', runner: 'scared' },
  { goose: 'honk', runner: 'slide' },
  { goose: 'dive', runner: 'hang' },
];


/** Room each beat of the story takes on the stem. */
const INTRO = 300;
const FINALE = 280;
const PANEL = 330;
const PITCH = 560;

interface Plan {
  intro: number;
  panels: { y: number; goose: ArtName; runner: ArtName; left: boolean }[];
  finale: number | null;
  leaves: number[];
}

/**
 * Lays the story down the stem, read top to bottom: the mascot climbs up to the castle, then
 * flees back down with the golden egg while the goose chases it (one panel per moment, as many as
 * fit), and the goose ends up tangled in the vine just above the ground. Leaves fill the gaps.
 */
function plan(space: number): Plan {
  const middle = space - INTRO - FINALE;
  const count = Math.max(0, Math.floor(middle / PITCH));
  const gap = count ? middle / count : 0;
  const panels = Array.from({ length: count }, (_, i) => ({
    y: INTRO + gap * i + (gap - PANEL) / 2,
    ...CHASE[i % CHASE.length],
    left: i % 2 === 0,
  }));
  const finale = space > INTRO + FINALE ? space - FINALE / 2 - 30 : null;

  // A leaf in the middle of every gap between two beats.
  const edges = [INTRO - 40, ...panels.flatMap((p) => [p.y, p.y + PANEL]), finale ? finale - 110 : space];
  const leaves: number[] = [];
  for (let i = 0; i + 1 < edges.length; i += 2) {
    if (edges[i + 1] - edges[i] > 90) leaves.push((edges[i] + edges[i + 1]) / 2);
  }
  return { intro: 150, panels, finale, leaves };
}

/**
 * Side art for an insight, desktop only: a beanstalk that grows the full length of the article,
 * from the magic beans on the ground at the bottom up to the castle in the clouds, with the
 * mascot's escape from the goose told down it. The stem and the chase repeat to fit the article.
 */
export default function Beanstalk({ className = '' }: { className?: string }) {
  const shaft = useRef<HTMLDivElement>(null);
  const [story, setStory] = useState<Plan | null>(null);

  useEffect(() => {
    const el = shaft.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setStory(plan(entry.contentRect.height)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <aside aria-hidden="true" className={`flex-col items-center select-none pointer-events-none ${className}`}>
      <div className="relative flex flex-1 flex-col" style={{ width: WIDTH }}>
        <div className="relative z-20 self-center">
          <Art name="castle" />
        </div>

        <div ref={shaft} className="relative flex-1" style={{ marginTop: -34 }}>
          <div
            className="absolute inset-y-0"
            style={{ left: CENTER - half, width: STEM, backgroundImage: STEM_TILE, backgroundSize: `${STEM}px ${TILE}px`, backgroundRepeat: 'repeat-y' }}
          />

          {story && (
            <>
              {story.leaves.map((y, i) => (
                <div key={`leaf-${i}`}>
                  <Leaf y={y} left={i % 2 === 0} />
                  <Leaf y={y + 34} left={i % 2 !== 0} width={70} />
                  <Tendril y={y - 44} left={i % 2 !== 0} />
                </div>
              ))}

              <OnStem name="climb" y={story.intro} />

              {story.panels.map((p, i) => (
                <div key={`panel-${i}`}>
                  <Beside name={p.goose} y={p.y + size(p.goose).height / 2} left={p.left} />
                  <OnStem name={p.runner} y={p.y + PANEL - size(p.runner).height / 2} />
                </div>
              ))}

              {story.finale !== null && <OnStem name="tangled" y={story.finale} />}
            </>
          )}
        </div>

        {/* The ground it grows from: the mascot safe at the bottom with the egg, beside the spilled magic beans. */}
        <div className="relative" style={{ height: 40 }}>
          <svg viewBox="0 0 240 40" width={WIDTH} height={40} className="absolute bottom-0 left-0 block overflow-visible">
            <path d="M-8 42 C20 40 52 6 120 4 C188 6 220 40 248 42 Z" fill="#fff" stroke="#111" strokeWidth={LINE + 1} strokeLinejoin="round" />
            <path d="M107 4 L107 -6 L133 -6 L133 4 C140 12 150 14 158 14 M107 4 C100 12 90 14 82 14" fill="#fff" stroke="#111" strokeWidth={LINE} strokeLinejoin="round" strokeLinecap="round" />
            <path d="M60 30 l8 -6 M176 28 l-8 -6 M96 26 l4 -8 M146 26 l-4 -8" fill="none" stroke="#111" strokeWidth={3} strokeLinecap="round" />
          </svg>
          <div className="absolute bottom-0 z-10" style={{ left: -78 }}>
            <Art name="beans" />
          </div>
          <div className="absolute bottom-0 z-10" style={{ left: CENTER + 24 }}>
            <Art name="win" />
          </div>
        </div>
      </div>
    </aside>
  );
}
