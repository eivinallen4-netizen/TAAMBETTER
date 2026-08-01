'use client';

import { motion, Variants } from 'motion/react';
import React from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  once?: boolean;
}

const directionVariants = {
  up: {
    initial: { opacity: 0, y: 50 },
    whileInView: { opacity: 1, y: 0 },
  },
  down: {
    initial: { opacity: 0, y: -50 },
    whileInView: { opacity: 1, y: 0 },
  },
  left: {
    initial: { opacity: 0, x: 50 },
    whileInView: { opacity: 1, x: 0 },
  },
  right: {
    initial: { opacity: 0, x: -50 },
    whileInView: { opacity: 1, x: 0 },
  },
};

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 0.6,
  once = false,
}: ScrollRevealProps) {
  const variants: Variants = {
    initial: directionVariants[direction].initial,
    whileInView: {
      ...directionVariants[direction].whileInView,
      transition: { duration, delay, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      initial="initial"
      whileInView="whileInView"
      viewport={{ once, amount: 0.3 }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
