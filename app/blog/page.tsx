import type { Metadata } from 'next';
import PageHero from '@/components/sections/PageHero';
import Section from '@/components/editorial/Section';
import { ArticleCard } from './components/ArticleCard';
import { BLOG_BASE_PATH, SITE_URL } from './constants';
import { LOCAL_POSTS } from './local-posts';

export const metadata: Metadata = {
  title: 'Marketing Blog: Video, Social and Lead Generation',
  description: 'Straight talk on short-form video, social media and marketing that brings in calls, bookings and sales.',
  alternates: { canonical: `${SITE_URL}${BLOG_BASE_PATH}` },
};

export default function BlogIndexPage() {
  const articles = [...LOCAL_POSTS].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  return (
    <>
      <PageHero
        eyebrow="Blog"
        title={'Better\nmarketing,\nwritten down.'}
        outlineFrom={2}
        size="lg"
        subtitle="Straight talk on short-form video, social media and marketing that brings in calls, bookings and sales."
      />

      <Section tone="ink" label="Articles">
        <ul className="border-t-2 rule">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </ul>
      </Section>
    </>
  );
}
