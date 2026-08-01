'use client';

import { motion } from 'motion/react';

interface FloatingElementProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  distance?: number;
}

export function FloatingElement({
  children,
  className = '',
  delay = 0,
  duration = 4,
  distance = 20,
}: FloatingElementProps) {
  return (
    <motion.div
      animate={{ y: [0, -distance, 0] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
