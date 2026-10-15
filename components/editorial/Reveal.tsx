'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Distance in px the element travels up while fading in. */
  y?: number;
  as?: 'div' | 'li' | 'span';
}

/** Fades content up once as it scrolls into view. Static when the visitor prefers reduced motion. */
export default function Reveal({ children, className, delay = 0, y = 40, as = 'div' }: RevealProps) {
  const reduce = useReducedMotion();
  const Component = motion[as];

  if (reduce) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Component>
  );
}
