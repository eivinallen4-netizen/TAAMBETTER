import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import InsightArticle from '@/components/insights/InsightArticle';
import { STATUS_LABEL } from '@/lib/pages/rules';
import { getPreviewPage } from '../../data';

// Private preview of any page, live or not, for review before publishing. The token is the only
// key, so the link is unguessable; it's noindex and never in the sitemap.

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Page preview',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default async function InsightPreview({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const page = await getPreviewPage(token);
  if (!page) notFound();

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-[80] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-white px-4 py-3 text-center text-sm font-bold text-[#111111]">
        <span className="eyebrow text-[#F46325]">Preview</span>
        <span>
          {STATUS_LABEL[page.status]}
          {page.status === 'published' ? ` at /insights/${page.slug}` : ' · not live, not indexed'}
        </span>
      </div>
      <InsightArticle
        title={page.title}
        lede={page.meta_description}
        body={page.body}
        faq={page.faq}
        publishedAt={page.published_at}
        cta={<span className="btn btn-solid">Let&apos;s talk</span>}
      />
    </>
  );
}
