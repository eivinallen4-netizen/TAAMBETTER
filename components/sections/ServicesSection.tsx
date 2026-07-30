'use client';

import Container from '../ui/Container';
import Title from '../ui/Title';
import Text from '../ui/Text';
import Badge from '../ui/Badge';
import Link from 'next/link';
import { getServiceInfo } from '@/app/lib/services';

interface ServicesSectionProps {
  services: string[];
  showMoreLink?: boolean;
}

export default function ServicesSection({ services, showMoreLink = true }: ServicesSectionProps) {
  return (
    <section className="bg-taam-near-black border-b border-gray-800">
      <Container>
        <div className="py-14 md:py-16">
          <div className="flex items-baseline justify-between mb-8">
            <Title as="h2" color="white">
              WHAT WE DO
            </Title>
            {showMoreLink && (
              <Link href="/about" className="text-sm font-semibold text-taam-orange hover:underline hidden sm:inline">
                MORE ABOUT US →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-gray-800">
            {services.map((service, idx) => {
              const info = getServiceInfo(service);
              return (
                <div key={service} className="bg-taam-near-black p-6 hover:bg-gray-900 transition">
                  <Badge>{String(idx + 1).padStart(2, '0')}</Badge>
                  <Title as="h3" color="white" className="text-lg mt-3 mb-2">
                    {info.name}
                  </Title>
                  <Text size="sm" color="gray-400" className="leading-relaxed">
                    {info.description}
                  </Text>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
