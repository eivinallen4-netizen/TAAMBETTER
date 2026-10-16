'use client';

import { useRef, type CSSProperties } from 'react';
import useInViewOnce from './useInViewOnce';

interface HeadlineProps {
  /** Lines separated by "\n". Each line is set on its own row, poster-style. */
  text: string;
  /** Lines from this index onward are set as outlined display type. */
  outlineFrom?: number;
  as?: 'h1' | 'h2' | 'p';
  className?: string;
  /** Animate on mount (heroes) instead of when scrolled into view. */
  immediate?: boolean;
}

/**
 * Oversized all-caps headline; each line rises out of its own mask.
 * The in-view trigger sits on the heading itself: the line spans start translated
 * outside their overflow-hidden masks, so observing them directly would never fire.
 * Reduced motion is handled in CSS (the lines just sit in place).
 */
export default function Headline({ text, outlineFrom = Infinity, as = 'h2', className = '', immediate = false }: HeadlineProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const shown = useInViewOnce(ref, 0.3);
  const lines = text.split('\n');
  const Tag = as;

  // Heroes rise in with CSS on first paint; the rest rise when scrolled into view.
  return (
    <Tag ref={ref} className={`display ${className}`} aria-label={lines.join(' ')} data-shown={immediate || shown || undefined}>
      {lines.map((l, i) => (
        <span key={i} aria-hidden="true" className="block [overflow-x:visible] [overflow-y:clip] pb-[0.06em] -mb-[0.06em]">
          <span
            className={`${immediate ? 'enter-rise' : 'rise-line'} block ${i >= outlineFrom ? 'outline-type' : ''}`}
            style={{ '--d': `${(immediate ? 0.06 : 0.08) * i}s` } as CSSProperties}
          >
            {l}
          </span>
        </span>
      ))}
    </Tag>
  );
}
