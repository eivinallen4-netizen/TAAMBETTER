'use client';

import { motion } from 'motion/react';
import { fadeInDown, slideInLeft, slideInRight, fadeInUp, slideInLeftScroll, slideInRightScroll } from '@/lib/motion-animations';

export function ProjectHeroAnimated({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={fadeInDown} initial="initial" animate="animate">
      {children}
    </motion.div>
  );
}

export function ProjectBackLinkAnimated({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.1 }}>
      {children}
    </motion.div>
  );
}

export function ProjectLeftSectionAnimated({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={slideInLeft} initial="initial" animate="animate" transition={{ delay: 0.4 }}>
      {children}
    </motion.div>
  );
}

export function ProjectRightSectionAnimated({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={slideInRight} initial="initial" animate="animate" transition={{ delay: 0.5 }}>
      {children}
    </motion.div>
  );
}

export function ProjectScrollAnimatedElement({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div variants={slideInLeftScroll} initial="initial" whileInView="whileInView" viewport={{ once: false, amount: 0.3 }} transition={{ delay }}>
      {children}
    </motion.div>
  );
}

export function ProjectScrollAnimatedImage({ children, direction = 'left' }: { children: React.ReactNode; direction?: 'left' | 'right' }) {
  const variant = direction === 'left' ? slideInLeftScroll : slideInRightScroll;
  return (
    <motion.div variants={variant} initial="initial" whileInView="whileInView" viewport={{ once: false, amount: 0.2 }}>
      {children}
    </motion.div>
  );
}
