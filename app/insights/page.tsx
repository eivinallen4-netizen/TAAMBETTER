import type { Metadata } from 'next';
import Link from 'next/link';
import PageHero from '@/components/sections/PageHero';
import Section from '@/components/editorial/Section';
import Arrow from '@/components/editorial/Arrow';
import { SITE_URL } from '@/lib/site-url';
import { publishedPages } from './data';

export const metadata: Metadata = {
  title: 'Marketing Insights for Local Businesses',
  description: 'Straight answers to the marketing questions business owners ask most: video, social, websites and getting found on Google.',
  alternates: { canonical: `${SITE_URL}/insights` },
};

export default async function InsightsIndex() {
  const pages = await publishedPages();

  return (
    <>
      <PageHero
        eyebrow="Insights"
        title={'Straight\nanswers.'}
        outlineFrom={1}
        size="lg"
        subtitle="The marketing questions business owners ask us most, answered without the fluff."
      />
      <Section tone="ink" label="Insights">
        {pages.length ? (
          <ul className="border-t-2 rule">
            {pages.map((p) => (
              <li key={p.slug} className="border-b-2 rule">
                <Link href={`/insights/${p.slug}`} className="group flex items-center justify-between gap-8 py-10">
                  <h2 className="display display-sm hover-outline">{p.title}</h2>
                  <span className="transition-transform duration-500 group-hover:translate-x-2">
                    <Arrow />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="lede">New answers are on the way.</p>
        )}
      </Section>
    </>
  );
}
