import type { Metadata } from 'next';
import PageHero from '@/components/sections/PageHero';
import Section from '@/components/editorial/Section';
import Mascot from '@/components/editorial/Mascot';
import { ArticleCard } from './components/ArticleCard';
import { Pagination } from './components/Pagination';
import { BLOG_BASE_PATH, SITE_URL } from './constants';
import { LOCAL_POSTS } from './local-posts';
import { safeGetAllArticles } from './lib/articles';
import { paginate, parsePage } from './pagination';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Straight talk on short-form video, social media and marketing that brings in calls, bookings and sales.',
  alternates: { canonical: `${SITE_URL}${BLOG_BASE_PATH}` },
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const remote = await safeGetAllArticles();
  const localSlugs = new Set(LOCAL_POSTS.map((p) => p.slug));
  const articles = [...LOCAL_POSTS, ...remote.filter((a) => !localSlugs.has(a.slug))].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
  const { items, info } = paginate(articles, parsePage(page));

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
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-6 py-16 text-center">
            <Mascot pose="fishing" size={280} className="mascot-bob w-56 h-auto" />
            <p className="lede">Nothing here yet. We&apos;re writing.</p>
          </div>
        ) : (
          <ul className="border-t-2 rule">
            {items.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </ul>
        )}

        <Pagination basePath={BLOG_BASE_PATH} info={info} />
      </Section>
    </>
  );
}
