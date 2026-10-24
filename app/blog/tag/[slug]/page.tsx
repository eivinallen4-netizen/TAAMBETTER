import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageHero from '@/components/sections/PageHero';
import Section from '@/components/editorial/Section';
import { ArticleCard } from '../../components/ArticleCard';
import { Pagination } from '../../components/Pagination';
import { BLOG_BASE_PATH } from '../../constants';
import { blog } from '../../lib/blog-client';
import { paginate, parsePage } from '../../pagination';

export const revalidate = 86400;

export async function generateStaticParams() {
  if (!process.env.BABYLOVEGROWTH_BLOG_API_KEY) return [];
  try {
    const tags = await blog.getTags();
    return tags.map((tag) => ({ slug: tag.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Tag listings are thin, duplicate content: keep them out of the index.
  return { title: `Articles on ${slug.replace(/-/g, ' ')}`, robots: { index: false, follow: true } };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page } = await searchParams;
  const articles = await blog.getArticlesByTag(slug).catch(() => []);
  if (articles.length === 0) {
    notFound();
  }
  const basePath = `${BLOG_BASE_PATH}/tag/${slug}`;
  const { items, info } = paginate(articles, parsePage(page));

  return (
    <>
      <PageHero
        eyebrow={`Blog — ${articles.length} ${articles.length === 1 ? 'article' : 'articles'}`}
        title={slug.replace(/-/g, ' ')}
        size="lg"
      />

      <Section tone="ink" label="Articles">
        <ul className="border-t-2 rule">
          {items.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </ul>

        <Pagination basePath={basePath} info={info} />
      </Section>
    </>
  );
}
