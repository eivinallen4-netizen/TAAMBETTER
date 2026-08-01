'use client';

import { motion, Variants } from 'motion/react';

interface ScaleRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function ScaleReveal({
  children,
  className = '',
  delay = 0,
  duration = 0.6,
}: ScaleRevealProps) {
  const variants: Variants = {
    initial: { opacity: 0, scale: 0.8 },
    whileInView: {
      opacity: 1,
      scale: 1,
      transition: { duration, delay, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileInView="whileInView"
      viewport={{ once: false, amount: 0.3 }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
