'use client';

import Container from '../ui/Container';
import Title from '../ui/Title';
import Text from '../ui/Text';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { staggerContainerScroll, staggerItemScroll } from '@/lib/motion-animations';
import { ScrollReveal, ParallaxLayer } from '../motion';

interface NewsItem {
  id: number;
  title: string;
  description: string;
  link: string;
  date: string;
}

interface NewsSectionProps {
  items: NewsItem[];
}

const getCategoryTag = (title: string) => {
  if (title.toLowerCase().includes('award')) return { tag: 'Award', color: 'bg-yellow-900/50 text-yellow-300' };
  if (title.toLowerCase().includes('studio')) return { tag: 'Studio', color: 'bg-blue-900/50 text-blue-300' };
  if (title.toLowerCase().includes('case study')) return { tag: 'Case Study', color: 'bg-purple-900/50 text-purple-300' };
  if (title.toLowerCase().includes('hiring')) return { tag: 'Hiring', color: 'bg-green-900/50 text-green-300' };
  return { tag: 'Update', color: 'bg-gray-800/50 text-gray-300' };
};

export default function NewsSection({ items }: NewsSectionProps) {
  return (
    <section className="bg-taam-near-black relative overflow-hidden">
      <ParallaxLayer offset={0} speed={0.3}>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl" />
      </ParallaxLayer>

      <Container>
        <div className="py-14 md:py-16 relative z-10">
          <ScrollReveal className="mb-12">
            <Title as="h2" color="white">
              NEWS &amp; UPDATES
            </Title>
          </ScrollReveal>

          <motion.div
            variants={staggerContainerScroll}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8"
          >
            {items.map((item, idx) => {
              const category = getCategoryTag(item.title);
              const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <motion.div key={item.id} variants={staggerItemScroll}>
                  <Link
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative"
                  >
                  <div className="border-b border-gray-800 group-hover:border-taam-orange/50 pb-6 transition duration-300">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap ${category.color} backdrop-blur-sm`}
                      >
                        {category.tag}
                      </span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formattedDate}
                      </span>
                    </div>

                    <Text
                      as="p"
                      className="text-base font-bold mb-2 group-hover:text-taam-orange transition flex items-center gap-2"
                    >
                      {item.title}
                      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </Text>
                    <Text size="sm" color="gray-500" className="group-hover:text-gray-400 transition">
                      {item.description}
                    </Text>
                  </div>

                  <div className="absolute -inset-3 rounded border border-taam-orange/0 group-hover:border-taam-orange/10 transition" />
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
