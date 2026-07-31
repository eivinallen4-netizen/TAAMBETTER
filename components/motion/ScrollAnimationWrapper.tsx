'use client';

import { motion, Variants } from 'motion/react';
import React from 'react';

interface ScrollAnimationWrapperProps {
  children: React.ReactNode;
  variants?: Variants;
  className?: string;
  delay?: number;
}

export function ScrollAnimationWrapper({
  children,
  variants = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  },
  className = '',
  delay = 0,
}: ScrollAnimationWrapperProps) {
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
