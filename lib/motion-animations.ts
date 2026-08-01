import { Variants } from 'motion/react';

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const slideInDown: Variants = {
  initial: { opacity: 0, y: -50 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const slideInUp: Variants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -100 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const float: Variants = {
  animate: {
    y: [-8, 0, -8],
    transition: { duration: 3, ease: 'easeInOut', repeat: Infinity },
  },
};

export const pulseGlow: Variants = {
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(244, 99, 37, 0.4)',
      '0 0 0 8px rgba(244, 99, 37, 0)',
    ],
    transition: { duration: 2, repeat: Infinity },
  },
};

export const rotateSlow: Variants = {
  animate: {
    rotate: 360,
    transition: { duration: 20, ease: 'linear', repeat: Infinity },
  },
};

export const glowPulse: Variants = {
  animate: {
    boxShadow: [
      '0 0 10px rgba(244, 99, 37, 0.3)',
      '0 0 25px rgba(244, 99, 37, 0.6)',
      '0 0 10px rgba(244, 99, 37, 0.3)',
    ],
    transition: { duration: 3, ease: 'easeInOut', repeat: Infinity },
  },
};

export const borderGlow: Variants = {
  animate: {
    borderColor: [
      'rgba(244, 99, 37, 0.2)',
      'rgba(244, 99, 37, 0.6)',
      'rgba(244, 99, 37, 0.2)',
    ],
    boxShadow: [
      '0 0 0 0 rgba(244, 99, 37, 0.1)',
      '0 0 15px rgba(244, 99, 37, 0.2)',
      '0 0 0 0 rgba(244, 99, 37, 0.1)',
    ],
    transition: { duration: 3, ease: 'easeInOut', repeat: Infinity },
  },
};

export const textGlow: Variants = {
  animate: {
    textShadow: [
      '0 0 0 rgba(244, 99, 37, 0)',
      '0 0 20px rgba(244, 99, 37, 0.5)',
      '0 0 0 rgba(244, 99, 37, 0)',
    ],
    transition: { duration: 4, ease: 'easeInOut', repeat: Infinity },
  },
};

export const shimmer: Variants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: { duration: 2, repeat: Infinity },
  },
};

export const gradientShift: Variants = {
  animate: {
    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
    transition: { duration: 6, ease: 'easeInOut', repeat: Infinity },
  },
};

export const slideInLeftScroll: Variants = {
  initial: { opacity: 0, x: -80 },
  whileInView: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] } },
};

export const slideInRightScroll: Variants = {
  initial: { opacity: 0, x: 80 },
  whileInView: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.34, 1.56, 0.64, 1] } },
};

export const fadeInScroll: Variants = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const fadeInUpScroll: Variants = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const scaleInScroll: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  whileInView: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

// Stagger container for animating multiple children
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Child variant for staggered animations
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export const parallaxLayerSlow: Variants = {
  initial: { y: 0 },
  animate: { y: -50, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const parallaxLayerMedium: Variants = {
  initial: { y: 0 },
  animate: { y: -30, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const parallaxLayerFast: Variants = {
  initial: { y: 0 },
  animate: { y: -10, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const staggerContainerScroll: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItemScroll: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};
