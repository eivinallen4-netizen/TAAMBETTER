'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import MediaCard from '@/components/editorial/MediaCard';
import Reveal from '@/components/editorial/Reveal';

interface Project {
  id: number;
  title: string;
  category: string;
  image?: string;
  tagline?: string;
  results?: { value: string; label: string }[];
}

export default function WorkGrid({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState('All');

  const categories = useMemo(() => ['All', ...Array.from(new Set(projects.map((p) => p.category)))], [projects]);
  const shown = active === 'All' ? projects : projects.filter((p) => p.category === active);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-6 border-b-2 rule pb-8 mb-16 md:mb-24">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActive(category)}
              aria-pressed={active === category}
              className={`btn !py-3 !px-5 ${active === category ? 'btn-solid' : 'btn-ghost'}`}
            >
              {category}
            </button>
          ))}
        </div>
        <p className="eyebrow text-[color:var(--tone-muted)]" aria-live="polite">
          {String(shown.length).padStart(2, '0')} project{shown.length === 1 ? '' : 's'}
        </p>
      </div>

      <ul className="grid grid-cols-12 gap-x-6 gap-y-24">
        {shown.map((project, i) => {
          // Asymmetric rhythm: full-width feature, then alternating offset pairs.
          const span =
            i === 0
              ? 'col-span-12'
              : i % 2
                ? 'col-span-12 md:col-span-7'
                : 'col-span-12 md:col-span-5 md:mt-40';
          return (
            <Reveal as="li" key={project.id} className={span} delay={0.05}>
              <Link href={`/work/${project.id}`} className="group block">
                {project.image && (
                  <MediaCard
                    src={project.image}
                    alt={project.title}
                    aspect={i === 0 ? 'aspect-[4/5] sm:aspect-[16/9]' : 'aspect-[4/5]'}
                    sizes={i === 0 ? '100vw' : '(min-width: 768px) 58vw, 100vw'}
                    priority={i === 0}
                  />
                )}
                <div className="mt-8 grid grid-cols-12 gap-x-6 gap-y-4 items-end">
                  <div className="col-span-12 lg:col-span-7">
                    <p className="eyebrow mb-4 text-[color:var(--tone-muted)]">
                      {String(i + 1).padStart(2, '0')} — {project.category}
                    </p>
                    <h2 className="display display-lg hover-outline">
                      {project.title}
                    </h2>
                  </div>
                  {project.results && i === 0 && (
                    <dl className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-6">
                      {project.results.slice(0, 2).map((r) => (
                        <div key={r.label} className="border-t rule pt-4 flex flex-col">
                          <dt className="eyebrow mt-2 order-2">{r.label}</dt>
                          <dd className="display display-md outline-type order-1">{r.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
                <span className="eyebrow link-line inline-block mt-6">View case study ↗</span>
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </>
  );
}
