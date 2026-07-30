'use client';

import Container from '../ui/Container';
import Text from '../ui/Text';

interface Stat {
  value: string;
  label: string;
}

interface StatsBarSectionProps {
  stats: Stat[];
}

export default function StatsBarSection({ stats }: StatsBarSectionProps) {
  return (
    <section className="bg-[#111111] border-y border-gray-800">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-800">
        {stats.map((stat) => (
          <div key={stat.label} className="py-6 px-4 first:pl-0">
            <div className="text-3xl md:text-4xl font-black text-[#F46325]">{stat.value}</div>
            <Text size="xs" color="gray-400" className="uppercase tracking-wide mt-1 md:text-sm">
              {stat.label}
            </Text>
          </div>
        ))}
      </div>
    </section>
  );
}
