'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { SLIDE_H, SLIDE_W } from './Slides';

// Shared by every deck page: fit a 1920×1080 slide to a box, and run the full-screen slideshow.

/** A slide drawn at full size and scaled to fit `width` (and `height`, when given). */
export function Scaled({ width, height, children }: { width: number; height?: number; children: React.ReactNode }) {
  const scale = Math.min(width / SLIDE_W, height ? height / SLIDE_H : Infinity);
  return (
    <div style={{ width: SLIDE_W * scale, height: SLIDE_H * scale }} className="relative overflow-hidden">
      <div
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Width of an element, measured from whenever it mounts (the stage only appears after loading). */
export function useWidth<T extends HTMLElement>() {
  const [width, setWidth] = useState(0);
  const observer = useRef<ResizeObserver | null>(null);
  const ref = useCallback((el: T | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    observer.current = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.current.observe(el);
  }, []);
  return [ref, width] as const;
}

/** Full-screen slideshow: arrows, space or click to move, Esc to leave. */
export function Presenter({
  count,
  start,
  onClose,
  children,
}: {
  count: number;
  start: number;
  onClose: (at: number) => void;
  children: (i: number) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(Math.min(start, count - 1));
  const [size, setSize] = useState({ w: 0, h: 0 });
  const at = useRef(i);
  useEffect(() => {
    at.current = i;
  }, [i]);

  useEffect(() => {
    const el = ref.current;
    el?.requestFullscreen?.().catch(() => {});
    const measure = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    measure();
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) setI((x) => Math.min(count - 1, x + 1));
      else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) setI((x) => Math.max(0, x - 1));
      else if (e.key === 'Home') setI(0);
      else if (e.key === 'End') setI(count - 1);
      else if (e.key === 'Escape' && !document.fullscreenElement) onClose(at.current);
      else return;
      e.preventDefault();
    };
    const onFs = () => {
      if (!document.fullscreenElement) onClose(at.current);
    };
    window.addEventListener('resize', measure);
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFs);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-[100] flex cursor-pointer items-center justify-center bg-black"
      onClick={(e) => setI((x) => (e.clientX < window.innerWidth / 3 ? Math.max(0, x - 1) : Math.min(count - 1, x + 1)))}
    >
      {size.w > 0 && (
        <Scaled width={size.w} height={size.h}>
          {children(i)}
        </Scaled>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose(at.current);
        }}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/70 opacity-0 transition hover:opacity-100"
        aria-label="Exit"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
