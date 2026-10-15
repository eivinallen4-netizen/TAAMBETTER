'use client';

import { useEffect, useRef } from 'react';

interface LoopVideoProps {
  src: string;
  poster?: string;
  position?: string;
  className?: string;
}

/**
 * Silent, looping footage used as decoration. Only loads and plays while on screen,
 * and stays on its poster frame for people who prefer reduced motion.
 */
export default function LoopVideo({ src, poster, position = 'center', className = '' }: LoopVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!el.src) el.src = src;
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src]);

  return (
    <video
      ref={ref}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full object-cover ${className}`}
      style={{ objectPosition: position }}
    />
  );
}
