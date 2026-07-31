'use client';

import { motion } from 'motion/react';

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function Particles() {
  const particles = [...Array(20)].map((_, i) => ({
    seed: i,
    initialX: seededRandom(i * 2) * 100 * 14.6,
    initialY: seededRandom(i * 3) * 100 * 8.22,
    animY1: seededRandom(i * 4) * 100 * 8.22,
    animY2: seededRandom(i * 5) * 100 * 8.22 - 8,
    animY3: seededRandom(i * 6) * 100 * 8.22,
    opacity: seededRandom(i * 7) * 0.3,
    delay: seededRandom(i * 8) * 2,
  }));

  return (
    <>
      {particles.map((p) => (
        <motion.div
          key={p.seed}
          className="absolute w-1 h-1 bg-white/10 rounded-full"
          initial={{ x: p.initialX, y: p.initialY }}
          animate={{
            y: [p.animY1, p.animY2, p.animY3],
          }}
          transition={{
            duration: 6,
            ease: 'easeInOut',
            repeat: Infinity,
            delay: p.delay,
          }}
          style={{
            opacity: p.opacity,
          }}
        />
      ))}
    </>
  );
}
