'use client';

import Container from '../ui/Container';
import Title from '../ui/Title';
import Text from '../ui/Text';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Link from 'next/link';

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

export default function HomeWorkGridSection({ projects }: HomeWorkGridSectionProps) {
  if (projects.length === 0) return null;

  return (
    <section className="bg-taam-near-black">
      <Container>
        <div className="py-14 md:py-16">
          <div className="flex items-baseline justify-between mb-8">
            <Title as="h2" color="orange">
              SELECTED WORK
            </Title>
            <Link href="/work" className="text-sm font-semibold text-taam-orange hover:underline">
              ALL PROJECTS →
            </Link>
          </div>

          {/* Large cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {projects.slice(0, 2).map((project) => (
              <Card
                key={project.id}
                href="/work"
                className="aspect-[4/3] group"
              >
                {project.image && project.image !== '/placeholder-project.jpg' && (
                  <img
                    src={project.image}
                    alt={project.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition duration-300" />
                <div className="relative z-10 p-5">
                  <Badge variant="primary">{project.category}</Badge>
                  <Title as="h3" color="white" className="text-xl mt-2 mb-1">
                    {project.title}
                  </Title>
                  <Text size="sm" color="gray-400" className="line-clamp-2">
                    {project.description}
                  </Text>
                </div>
              </Card>
            ))}
          </div>

          {/* Small cards grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {projects.slice(2, 6).map((project) => (
              <Card
                key={project.id}
                href="/work"
                className="aspect-square group"
              >
                {project.image && project.image !== '/placeholder-project.jpg' && (
                  <img
                    src={project.image}
                    alt={project.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition duration-300" />
                <div className="relative z-10 p-3">
                  <Badge variant="secondary">{project.category}</Badge>
                  <Title as="h3" color="white" className="text-sm mt-1">
                    {project.title}
                  </Title>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
