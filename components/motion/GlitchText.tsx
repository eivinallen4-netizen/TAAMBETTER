'use client';

import { motion, Variants } from 'motion/react';

interface GlitchTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export function GlitchText({ text, className = '', delay = 0 }: GlitchTextProps) {
  const variants: Variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  };

  const letterVariants: Variants = {
    initial: { opacity: 0, y: 10 },
    animate: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: delay + i * 0.05,
        duration: 0.5,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <motion.span variants={variants} initial="initial" animate="animate" className={className}>
      {text.split('').map((letter, i) => (
        <motion.span
          key={i}
          custom={i}
          variants={letterVariants}
          initial="initial"
          animate="animate"
        >
          {letter}
        </motion.span>
      ))}
    </motion.span>
  );
}
