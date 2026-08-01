'use client';

import Container from '../ui/Container';
import Text from '../ui/Text';
import { motion } from 'motion/react';
import { staggerContainerScroll, staggerItemScroll } from '@/lib/motion-animations';
import { ParallaxLayer } from '../motion/ParallaxLayer';

interface Stat {
  value: string;
  label: string;
}

interface StatsBarSectionProps {
  stats: Stat[];
}

export default function StatsBarSection({ stats }: StatsBarSectionProps) {
  return (
    <section className="relative bg-[#111111] border-y border-gray-800 overflow-hidden">
      {/* Video background with Parallax */}
      <ParallaxLayer offset={0} speed={0.3}>
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          >
            <source src="/construction-timelapse.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/85" />
        </div>
      </ParallaxLayer>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24%,rgba(244,99,37,.03)_25%,rgba(244,99,37,.03)_26%,transparent_27%,transparent_74%,rgba(244,99,37,.03)_75%,rgba(244,99,37,.03)_76%,transparent_77%,transparent)] bg-[length:80px_100%]" />

      {/* Stats content */}
      <motion.div
        variants={staggerContainerScroll}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-800/50"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            variants={staggerItemScroll}
            className="py-8 px-4 first:pl-0 group cursor-pointer relative"
            whileHover={{ scale: 1.05 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/5 group-hover:to-orange-500/10 transition duration-500" />

            <div className="relative z-10">
              <div className="relative inline-block group-hover:scale-105 transition-transform duration-300">
                <div className="text-4xl md:text-5xl font-black text-[#F46325] leading-none group-hover:drop-shadow-[0_0_20px_rgba(244,99,37,0.4)] transition">
                  {stat.value}
                </div>
              </div>
              <Text
                size="xs"
                color="gray-300"
                className="uppercase tracking-widest mt-3 md:text-sm font-semibold group-hover:text-taam-orange transition"
              >
                {stat.label}
              </Text>
            </div>

            <div className="absolute -inset-2 rounded border border-orange-500/0 group-hover:border-orange-500/20 transition" />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
