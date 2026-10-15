'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';

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

const line: Variants = {
  hidden: { y: '105%' },
  shown: (i: number) => ({ y: '0%', transition: { duration: 1.1, delay: 0.08 * i, ease: [0.16, 1, 0.3, 1] } }),
};

/**
 * Oversized all-caps headline; each line rises out of its own mask.
 * The in-view trigger sits on the heading itself: the line spans start translated
 * outside their overflow-hidden masks, so observing them directly would never fire.
 */
export default function Headline({ text, outlineFrom = Infinity, as = 'h2', className = '', immediate = false }: HeadlineProps) {
  const reduce = useReducedMotion();
  const lines = text.split('\n');
  const label = lines.join(' ');

  if (reduce) {
    const Tag = as;
    return (
      <Tag className={`display ${className}`}>
        {lines.map((l, i) => (
          <span key={i} className={`block ${i >= outlineFrom ? 'outline-type' : ''}`}>
            {l}
          </span>
        ))}
      </Tag>
    );
  }

  const Tag = motion[as];
  return (
    <Tag
      className={`display ${className}`}
      aria-label={label}
      initial="hidden"
      {...(immediate
        ? { animate: 'shown', transition: { delayChildren: 0.15 } }
        : { whileInView: 'shown', viewport: { once: true, amount: 0.3 } })}
    >
      {lines.map((l, i) => (
        <span key={i} aria-hidden="true" className="block [overflow-x:visible] [overflow-y:clip] pb-[0.06em] -mb-[0.06em]">
          <motion.span custom={i} variants={line} className={`block ${i >= outlineFrom ? 'outline-type' : ''}`}>
            {l}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
