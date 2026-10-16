'use client';

import { useRef, useState } from 'react';

interface Reel {
  src: string;
  title: string;
}

/** A horizontal run of vertical reels in rounded cards. Hover previews muted; click plays with sound. */
export default function ReelStrip({ reels }: { reels: Reel[] }) {
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  const [playing, setPlaying] = useState<number | null>(null);

  function toggle(i: number) {
    refs.current.forEach((v, j) => {
      if (v && j !== i) {
        v.pause();
        v.muted = true;
      }
    });
    const video = refs.current[i];
    if (!video) return;
    if (playing === i && !video.paused) {
      video.pause();
      setPlaying(null);
    } else {
      video.muted = false;
      video.play().catch(() => {});
      setPlaying(i);
    }
  }

  return (
    <ul className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-6 -mx-[var(--gutter)] px-[var(--gutter)] [scrollbar-width:thin]">
      {reels.map((reel, i) => (
        <li key={reel.src} className="snap-start shrink-0 w-[68vw] sm:w-[40vw] md:w-[28vw] lg:w-[21vw]">
          <button
            type="button"
            onClick={() => toggle(i)}
            onMouseEnter={() => playing === null && refs.current[i]?.play().catch(() => {})}
            onMouseLeave={() => playing !== i && refs.current[i]?.pause()}
            aria-label={`${playing === i ? 'Pause' : 'Play'} ${reel.title}`}
            className="media-card group block w-full aspect-[9/16] text-left outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--tone-bg)]"
          >
            <video
              ref={(el) => {
                refs.current[i] = el;
              }}
              src={reel.src}
              poster={reel.src.replace(/\.mp4$/, '.jpg')}
              muted
              loop
              playsInline
              preload="none"
              onEnded={() => setPlaying(null)}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" aria-hidden="true" />
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
              <span className="eyebrow">{String(i + 1).padStart(2, '0')}</span>
              <span className="eyebrow">{playing === i ? 'Pause ❚❚' : 'Play ▶'}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
