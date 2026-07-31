'use client';

import Container from '../ui/Container';
import Title from '../ui/Title';
import Card from '../ui/Card';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { staggerContainer, staggerItem } from '@/lib/motion-animations';

interface Project {
  id: number;
  title: string;
  category: string;
  description: string;
  image?: string;
}

interface HomeWorkGridSectionProps {
  projects: Project[];
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  branding: { bg: 'bg-purple-900/60', text: 'text-purple-300' },
  'web design': { bg: 'bg-blue-900/60', text: 'text-blue-300' },
  'digital development': { bg: 'bg-cyan-900/60', text: 'text-cyan-300' },
  'creative strategy': { bg: 'bg-pink-900/60', text: 'text-pink-300' },
  'content creation': { bg: 'bg-green-900/60', text: 'text-green-300' },
};

export default function HomeWorkGridSection({ projects }: HomeWorkGridSectionProps) {
  if (projects.length === 0) return null;

  const getCategoryStyle = (category: string) =>
    categoryColors[category.toLowerCase()] || { bg: 'bg-gray-800/60', text: 'text-gray-300' };

  return (
    <section className="bg-taam-near-black relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />

      <Container>
        <div className="py-14 md:py-16 relative z-10">
          <div className="flex items-baseline justify-between mb-12">
            <Title as="h2" color="orange">
              SELECTED WORK
            </Title>
            <Link
              href="/work"
              className="text-sm font-semibold text-taam-orange hover:text-taam-tint-2 transition flex items-center gap-2"
            >
              ALL PROJECTS
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition" />
            </Link>
          </div>

          {/* Large cards grid */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
          >
            {projects.slice(0, 2).map((project, index) => {
              const categoryStyle = getCategoryStyle(project.category);
              const direction = index % 2 === 0 ? 'left' : 'right';
              return (
                <motion.div key={project.id} variants={staggerItem}>
                  <Card
                    href={`/work/${project.id}`}
                    className="aspect-video group relative overflow-hidden"
                  >
                  {project.image && project.image !== '/placeholder-project.jpg' && (
                    <img
                      src={project.image}
                      alt={project.title}
                      data-scroll-animate={direction}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/40 to-transparent group-hover:from-black/60 group-hover:via-black/30 transition duration-300" />

                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition duration-300">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${categoryStyle.bg} ${categoryStyle.text}`}>
                      {project.category}
                    </span>
                  </div>

                  <div className="absolute inset-0 group-hover:border-2 group-hover:border-taam-orange/50 transition duration-300" />

                  <div className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition duration-300 transform translate-x-4 group-hover:translate-x-0">
                    <div className="bg-taam-orange rounded-full p-2">
                      <ArrowUpRight className="w-5 h-5 text-black" />
                    </div>
                  </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Small cards grid */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {projects.slice(2, 6).map((project, index) => {
              const categoryStyle = getCategoryStyle(project.category);
              const direction = index % 2 === 0 ? 'left' : 'right';
              return (
                <motion.div key={project.id} variants={staggerItem}>
                  <Card
                    href={`/work/${project.id}`}
                    className="aspect-square group relative overflow-hidden"
                  >
                  {project.image && project.image !== '/placeholder-project.jpg' && (
                    <img
                      src={project.image}
                      alt={project.title}
                      data-scroll-animate={direction}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/40 to-transparent group-hover:from-black/60 group-hover:via-black/30 transition duration-300" />

                  <div className="absolute top-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition duration-300 scale-75 group-hover:scale-100">
                    <span className={`px-2 py-1 rounded text-xs font-semibold backdrop-blur-sm ${categoryStyle.bg} ${categoryStyle.text}`}>
                      {project.category}
                    </span>
                  </div>

                  <div className="absolute inset-0 group-hover:border-2 group-hover:border-taam-orange/50 transition duration-300" />
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
