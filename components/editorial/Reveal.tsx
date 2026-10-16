'use client';

import { useRef, type CSSProperties, type ReactNode } from 'react';
import useInViewOnce from './useInViewOnce';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Distance in px the element travels up while fading in. */
  y?: number;
  as?: 'div' | 'li' | 'span';
}

/** Fades content up once as it scrolls into view (CSS `.reveal`). Static when the visitor prefers reduced motion. */
export default function Reveal({ children, className = '', delay = 0, y = 40, as = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const shown = useInViewOnce(ref, 0.25);
  const Tag = as;

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${className}`}
      data-shown={shown || undefined}
      style={{ '--reveal-y': `${y}px`, '--d': `${delay}s` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
