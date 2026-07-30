'use client';

import Container from '../ui/Container';
import Title from '../ui/Title';
import Text from '../ui/Text';
import Link from 'next/link';

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

export default function NewsSection({ items }: NewsSectionProps) {
  return (
    <section className="bg-taam-near-black">
      <Container>
        <div className="py-14 md:py-16">
          <Title as="h2" color="white" className="mb-8">
            NEWS &amp; UPDATES
          </Title>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.link}
                className="border-b border-gray-800 pb-6 group hover:border-taam-orange transition flex items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <Text as="p" className="text-base font-bold mb-1 group-hover:text-taam-orange transition">
                    {item.title}
                  </Text>
                  <Text size="sm" color="gray-500" className="line-clamp-1">
                    {item.description}
                  </Text>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap pt-1">
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
