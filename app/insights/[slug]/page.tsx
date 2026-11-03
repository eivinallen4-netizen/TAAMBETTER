import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ContactCTA from '@/app/components/ContactCTA';
import Arrow from '@/components/editorial/Arrow';
import InsightArticle, { defaultSchema, jsonLdHtml } from '@/components/insights/InsightArticle';
import { SITE_URL } from '@/lib/site-url';
import { getPublishedPage, publishedPages } from '../data';

// A published SEO page. Rendered on first visit and cached; publishing, editing or unpublishing in
// /admin/pages (or over MCP) revalidates it (lib/pages/store.ts).

export async function generateStaticParams() {
  return (await publishedPages()).map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) return {};
  const url = `${SITE_URL}/insights/${page.slug}`;
  return {
    title: { absolute: page.meta_title },
    description: page.meta_description,
    keywords: [page.main_keyword, ...page.secondary_keywords],
    alternates: { canonical: url },
    openGraph: {
      title: page.meta_title,
      description: page.meta_description,
      type: 'article',
      url,
      ...(page.published_at ? { publishedTime: page.published_at } : {}),
      modifiedTime: page.updated_at,
    },
  };
}

export default async function InsightPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) notFound();

  const url = `${SITE_URL}/insights/${page.slug}`;
  const schema = page.schema_jsonld ? JSON.parse(page.schema_jsonld) : defaultSchema(page, url, SITE_URL);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(schema) }} />
      <InsightArticle
        title={page.title}
        lede={page.meta_description}
        body={page.body}
        faq={page.faq}
        publishedAt={page.published_at}
        cta={
          <ContactCTA className="btn btn-solid">
            Let&apos;s talk <Arrow />
          </ContactCTA>
        }
      />
    </>
  );
}
