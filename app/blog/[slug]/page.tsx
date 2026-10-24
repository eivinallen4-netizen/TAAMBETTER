import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Section from '@/components/editorial/Section';
import Mascot from '@/components/editorial/Mascot';
import ContactCTA from '../../components/ContactCTA';
import { ArticleJsonLd } from '../components/ArticleJsonLd';
import { TagList } from '../components/TagList';
import { BLOG_BASE_PATH, SITE_URL } from '../constants';
import { formatDate } from '../format';
import { blog } from '../lib/blog-client';
import { safeGetAllArticles } from '../lib/articles';
import '../blog-content.css';

export const revalidate = 86400;

export async function generateStaticParams() {
  const articles = await safeGetAllArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

async function getArticle(slug: string) {
  try {
    return await blog.getArticleBySlug(slug);
  } catch (error) {
    console.error(`[blog] BabyLoveGrowth article "${slug}" failed to load`, error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) {
    return {};
  }
  const canonical = `${SITE_URL}${BLOG_BASE_PATH}/${article.slug}`;
  return {
    title: article.title,
    description: article.meta_description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.meta_description,
      url: canonical,
      publishedTime: article.published_at,
      modifiedTime: article.updated_at,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article || !article.published) {
    notFound();
  }

  return (
    <>
      <ArticleJsonLd data={article.jsonLd} />
      <ArticleJsonLd data={article.faqJsonLd} />

      <section className="tone-orange relative overflow-clip">
        <div className="gutter pt-32 md:pt-40 pb-16 md:pb-24">
          <div className="flex items-baseline justify-between gap-6 mb-10 md:mb-14">
            <Link href={BLOG_BASE_PATH} className="eyebrow link-line">
              ← Blog
            </Link>
            <time dateTime={article.published_at} className="eyebrow">
              {formatDate(article.published_at)}
            </time>
          </div>
          <h1 className="display display-md max-w-[18ch]">{article.title}</h1>
          {article.meta_description && (
            <p className="lede mt-10 max-w-2xl">{article.meta_description}</p>
          )}
        </div>
      </section>

      <Section tone="ink">
        <article className="grid lg:grid-cols-12 gap-x-16">
          <div className="lg:col-span-8">
            <div className="blog-content" dangerouslySetInnerHTML={{ __html: article.content_html }} />

            <footer className="mt-16 border-t-2 rule pt-8">
              <TagList keywords={[article.seedKeyword ?? '', ...article.keywords]} />
            </footer>
          </div>

          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-32 space-y-6">
              <Mascot pose="phone" size={224} className="mascot-bob w-48 h-auto" />
              <p className="display display-sm">
                Want this done <span className="outline-type">for you?</span>
              </p>
              <ContactCTA className="btn btn-solid">Talk to TAAM</ContactCTA>
            </div>
          </aside>
        </article>
      </Section>
    </>
  );
}
