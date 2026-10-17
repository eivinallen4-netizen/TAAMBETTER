'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { TOWER_WIDTH } from './tower-size';

const art = (name: string) => `/blog/art/${name}.webp`;

/** Source art is 471px wide; each floor's intrinsic height, cut ledge-to-ledge so they stack seamlessly. */
const ART_WIDTH = 471;
const FLOORS: Record<number, number> = { 1: 144, 2: 145, 3: 161, 4: 148, 5: 142, 6: 145, 7: 141, 8: 145 };

/** Plain balcony floors (1) break up the themed ones: sunglasses, studio, phone, trophy, money, marquee, stars. */
const SEQUENCE = [2, 3, 1, 4, 5, 1, 6, 7, 1, 8, 1];

const WIDTH = TOWER_WIDTH;
const scale = WIDTH / ART_WIDTH;

/** Picks a whole number of floors closest to the space, then stretches them a hair to fill it exactly. */
function planFloors(space: number) {
  const floors: number[] = [];
  let total = 0;
  for (let i = 0; total < space; i++) {
    const f = SEQUENCE[i % SEQUENCE.length];
    const h = FLOORS[f] * scale;
    if (total + h / 2 > space && floors.length) break;
    floors.push(f);
    total += h;
  }
  return { floors, stretch: total ? space / total : 1 };
}

/**
 * Right-rail art for desktop: an apartment tower in the mascot's style whose floors run the full
 * length of the article, landing its front door on the Street beside the closing CTA.
 */
export default function Tower() {
  const shaft = useRef<HTMLDivElement>(null);
  const [plan, setPlan] = useState<{ floors: number[]; stretch: number }>({ floors: [], stretch: 1 });

  useEffect(() => {
    const el = shaft.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setPlan(planFloors(entry.contentRect.height)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <aside aria-hidden="true" className="hidden lg:flex lg:col-span-5 flex-col items-center select-none pointer-events-none">
      <div className="flex-1 flex flex-col" style={{ width: WIDTH }}>
        <Image src={art('tower-roof')} alt="" width={ART_WIDTH} height={179} sizes={`${WIDTH}px`} className="w-full h-auto block" />
        <div ref={shaft} className="flex-1 overflow-hidden">
          {plan.floors.map((f, i) => (
            <Image
              key={i}
              src={art(`floor-${f}`)}
              alt=""
              width={ART_WIDTH}
              height={FLOORS[f]}
              sizes={`${WIDTH}px`}
              className="w-full block"
              style={{ height: FLOORS[f] * scale * plan.stretch }}
            />
          ))}
        </div>
        <Image src={art('tower-door')} alt="" width={ART_WIDTH} height={176} sizes={`${WIDTH}px`} className="w-full h-auto block" />
      </div>
    </aside>
  );
}
