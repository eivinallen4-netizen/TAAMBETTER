'use client';

import { useEffect, useRef } from 'react';

interface LoopVideoProps {
  src: string;
  position?: string;
  className?: string;
}

/**
 * Silent, looping footage used as decoration, laid over a still <Image> of its first frame
 * (so there's no poster to download). Only loads and plays while on screen, and stays
 * on the still for people who prefer reduced motion.
 */
export default function LoopVideo({ src, position = 'center', className = '' }: LoopVideoProps) {
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
    // Hold the footage until the page itself has loaded, so it never competes
    // with the scripts, styles and fonts the first paint needs.
    const start = () => io.observe(el);
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
    return () => {
      window.removeEventListener('load', start);
      io.disconnect();
    };
  }, [src]);

  return (
    <video
      ref={ref}
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
