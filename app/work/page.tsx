'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import SimpleHeader from '../components/SimpleHeader';
import siteContent from '../content/siteContent.json';
import Container from '@/components/ui/Container';
import Text from '@/components/ui/Text';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import CTASection from '@/components/sections/CTASection';
import Title from '@/components/ui/Title';
import { stripHtml } from '@/lib/text-utils';

export default function Work() {
  const content = siteContent;
  const [activeCategory, setActiveCategory] = useState('All');

  const colorClasses: Record<string, string> = {
    red: 'from-red-900 to-red-700 border-red-500',
    cyan: 'from-cyan-900 to-cyan-700 border-cyan-400',
    yellow: 'from-yellow-900 to-yellow-700 border-yellow-400',
    purple: 'from-purple-900 to-purple-700 border-purple-500',
    green: 'from-green-900 to-green-700 border-green-500',
    orange: 'from-orange-900 to-orange-700 border-orange-500',
    blue: 'from-blue-900 to-blue-700 border-blue-500',
    pink: 'from-pink-900 to-pink-700 border-pink-500',
  };

  const textColorClasses: Record<string, string> = {
    red: 'text-red-400',
    cyan: 'text-cyan-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
    blue: 'text-blue-400',
    pink: 'text-pink-400',
  };

  const sizeSpanClasses: Record<string, string> = {
    small: 'col-span-1 row-span-1',
    wide: 'col-span-2 row-span-1',
    tall: 'col-span-1 row-span-2',
    large: 'col-span-2 row-span-2',
  };

  const publishedProjects = useMemo(
    () => content.projects.filter((p) => p.published !== false),
    [content.projects]
  );

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(publishedProjects.map((p) => p.category)))],
    [publishedProjects]
  );

  const filteredProjects = useMemo(
    () =>
      activeCategory === 'All'
        ? publishedProjects
        : publishedProjects.filter((p) => p.category === activeCategory),
    [publishedProjects, activeCategory]
  );

  return (
    <div className="bg-black text-white">
      <SimpleHeader
        title={content.hero.work.title}
        subtitle={content.hero.work.subtitle}
      />

      {/* Filters + count */}
      <section className="max-w-7xl mx-auto px-6 pt-14">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-full border transition ${
                  activeCategory === category
                    ? 'bg-[#F46325] border-[#F46325] text-white'
                    : 'border-gray-700 text-gray-400 hover:border-[#F46325] hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {filteredProjects.length} project{filteredProjects.length === 1 ? '' : 's'}
          </span>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[220px] md:auto-rows-[260px]">
          {filteredProjects.map((project, index) => {
            const colorClass = colorClasses[project.color as keyof typeof colorClasses] || colorClasses.red;
            const textColorClass = textColorClasses[project.color as keyof typeof textColorClasses] || textColorClasses.red;
            const spanClass = sizeSpanClasses[project.size] || sizeSpanClasses.small;
            const direction = index % 2 === 0 ? 'left' : 'right';

            return (
              <Card
                key={project.id}
                href={`/work/${project.id}`}
                className={`${spanClass} bg-gradient-to-br ${colorClass} hover:shadow-2xl`}
              >
                {project.image && project.image !== '/placeholder-project.jpg' ? (
                  <img src={project.image} alt={project.title} data-scroll-animate={direction} className="absolute inset-0 w-full h-full object-cover" />
                ) : null}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition duration-300" />
                <div className="relative z-10 p-4">
                  <Badge className={textColorClass}>{project.category}</Badge>
                  <Title as="h3" color="white" className="text-base md:text-xl mt-1">
                    {project.title}
                  </Title>
                  {(project.size === 'large' || project.size === 'wide') && (
                    <Text size="sm" color="white" className="text-white/70 mt-2 line-clamp-2 max-w-md">
                      {stripHtml(project.description)}
                    </Text>
                  )}
                  <div className={`text-xs mt-2 font-semibold ${textColorClass} opacity-0 group-hover:opacity-100 transition`}>
                    VIEW DETAILS →
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <CTASection
        title="READY TO STOP SETTLING?"
        description="Tell us the challenge. We'll tell you straight whether we're the right team to dismantle it."
        variant="work"
      />
    </div>
  );
}
