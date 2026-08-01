'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useRef, useEffect, useState } from 'react';

interface ParallaxLayerProps {
  children: React.ReactNode;
  offset?: number;
  className?: string;
  speed?: number;
  targetRef?: React.RefObject<HTMLElement>;
}

export function ParallaxLayer({
  children,
  offset = 0,
  className = '',
  speed = 0.5,
  targetRef,
}: ParallaxLayerProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef || ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 50 * speed]);

  return (
    <motion.div ref={!targetRef ? ref : undefined} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
