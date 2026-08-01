'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

interface SmoothScrollProps {
  children: React.ReactNode;
  className?: string;
}

export function SmoothScroll({ children, className = '' }: SmoothScrollProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start center', 'end center'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5, 1], [50, 0, 0]);

  return (
    <motion.div ref={ref} style={{ opacity, y }} className={className}>
      {children}
    </motion.div>
  );
}
