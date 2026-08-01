'use client';

import Container from '../ui/Container';
import Title from '../ui/Title';
import Text from '../ui/Text';
import Badge from '../ui/Badge';
import Link from 'next/link';
import { getServiceInfo } from '@/app/lib/services';
import { Palette, Globe, Zap, Lightbulb, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { staggerContainerScroll, staggerItemScroll } from '@/lib/motion-animations';
import { ScrollReveal } from '../motion/ScrollReveal';

interface ServicesSectionProps {
  services: string[];
  showMoreLink?: boolean;
}

const serviceIcons: Record<string, typeof Palette> = {
  branding: Palette,
  'web design': Globe,
  'digital development': Zap,
  'creative strategy': Lightbulb,
  'content creation': FileText,
};

export default function ServicesSection({ services, showMoreLink = true }: ServicesSectionProps) {
  return (
    <section className="bg-taam-near-black border-b border-gray-800 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900/5 via-transparent to-transparent pointer-events-none" />

      <Container>
        <div className="py-14 md:py-16 relative z-10">
          <ScrollReveal className="flex items-baseline justify-between mb-12">
            <Title as="h2" color="white">
              WHAT WE DO
            </Title>
            {showMoreLink && (
              <Link href="/about" className="text-sm font-semibold text-taam-orange hover:text-taam-tint-2 transition hidden sm:inline">
                MORE ABOUT US →
              </Link>
            )}
          </ScrollReveal>

          <motion.div
            variants={staggerContainerScroll}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-gray-800"
          >
            {services.map((service, idx) => {
              const info = getServiceInfo(service);
              const Icon = serviceIcons[service.toLowerCase()] || Palette;
              return (
                <motion.div
                  key={service}
                  variants={staggerItemScroll}
                  className="bg-taam-near-black p-6 hover:bg-gray-900/80 transition duration-300 group relative overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-orange-500/0 group-hover:from-orange-500/5 group-hover:to-orange-500/10 transition duration-300" />

                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg group-hover:shadow-orange-500/30">
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    <Badge className="group-hover:bg-orange-600 transition">{String(idx + 1).padStart(2, '0')}</Badge>
                    <Title as="h3" color="white" className="text-lg mt-3 mb-2 group-hover:text-taam-orange transition">
                      {info.name}
                    </Title>
                    <Text size="sm" color="gray-400" className="leading-relaxed group-hover:text-gray-300 transition">
                      {info.description}
                    </Text>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
