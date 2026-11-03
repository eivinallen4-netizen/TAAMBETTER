import type { ReactNode } from 'react';
import Mascot from '@/components/editorial/Mascot';
import { renderMarkdown } from '@/lib/pages/markdown';
import type { FaqItem } from '@/lib/pages/rules';

// One SEO page (/insights/[slug]) in the site's editorial style. The live page, the private
// preview link and the admin editor's live preview all render through this, so what the team
// reviews is exactly what goes live.

export interface InsightArticleProps {
  title: string;
  /** Shown under the headline; the meta description doubles as the lede. */
  lede: string;
  body: string;
  faq: FaqItem[];
  publishedAt?: string | null;
  /** The closing call to action (the live page opens the contact form; the admin preview can't). */
  cta: ReactNode;
  /** Single column, for the admin's side-by-side preview pane. */
  compact?: boolean;
}

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' });
}

export default function InsightArticle({ title, lede, body, faq, publishedAt, cta, compact = false }: InsightArticleProps) {
  const { html, headings } = renderMarkdown(body);
  const date = formatDate(publishedAt);
  const wide = !compact;

  return (
    <>
      <section className="tone-orange relative overflow-clip">
        <div className={`gutter ${wide ? 'pt-32 md:pt-40' : 'pt-12'} pb-[var(--gutter)]`}>
          <div className="flex items-baseline justify-between gap-6 mb-10">
            <p className="eyebrow">Insights</p>
            <p className="eyebrow">{date || 'Las Vegas, NV'}</p>
          </div>
          <h1 className={`display ${wide ? 'display-lg' : 'display-md'} max-w-[18ch]`}>{title || 'Untitled page'}</h1>
          <div className={`grid grid-cols-12 gap-6 ${wide ? 'mt-14 md:mt-20' : 'mt-10'}`}>
            {lede && <p className={`lede col-span-12 ${wide ? 'md:col-span-6 md:col-start-7 lg:col-span-5 lg:col-start-8' : ''}`}>{lede}</p>}
          </div>
        </div>
        {wide && <Mascot pose="peek" size={220} className="absolute bottom-0 left-[var(--gutter)] hidden w-44 lg:block" />}
      </section>

      <section className="tone-ink relative overflow-clip">
        <article className={`gutter grid gap-x-16 ${wide ? 'lg:grid-cols-12 py-[var(--section-pad)]' : 'py-12'}`}>
          <div
            className={`insight-body space-y-6 text-lg leading-relaxed ${wide ? 'lg:col-span-7' : ''}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
          {wide && headings.length > 1 && (
            <nav aria-label="In this article" className="hidden lg:block lg:col-span-4 lg:col-start-9">
              <div className="sticky top-28">
                <p className="eyebrow mb-4 opacity-70">In this article</p>
                <ol className="border-t-2 rule">
                  {headings.map((h, i) => (
                    <li key={h.id} className="border-b rule">
                      <a href={`#${h.id}`} className="flex items-baseline gap-4 py-3 font-semibold">
                        <span className="eyebrow opacity-60">{String(i + 1).padStart(2, '0')}</span>
                        <span className="link-line">{h.text}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </nav>
          )}
        </article>
      </section>

      {faq.length > 0 && (
        <section className="tone-orange relative overflow-clip">
          <div className={`gutter ${wide ? 'py-[var(--section-pad)] grid lg:grid-cols-12 gap-x-16' : 'py-12'}`}>
            <h2 className={`display ${wide ? 'display-md lg:col-span-4' : 'display-sm'} mb-10`}>
              Questions, <span className="outline-type">answered.</span>
            </h2>
            <div className={`border-t-2 rule ${wide ? 'lg:col-span-8' : ''}`}>
              {faq.map((f, i) => (
                <details key={i} className="group border-b-2 rule py-5" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-xl font-extrabold">
                    <span>{f.question}</span>
                    <span aria-hidden="true" className="text-2xl leading-none transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 text-lg leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="tone-ink relative overflow-clip">
        <div className={`gutter ${wide ? 'py-[var(--section-pad)]' : 'py-12'}`}>
          <h2 className={`display ${wide ? 'display-lg' : 'display-md'}`}>
            Let&apos;s make your
            <br />
            <span className="outline-type">customers say wow.</span>
          </h2>
          <div className="mt-10 flex flex-wrap items-center gap-6">{cta}</div>
        </div>
        {wide && <Mascot pose="wave" size={260} className="absolute bottom-0 right-[var(--gutter)] hidden w-56 md:block" />}
      </section>
    </>
  );
}

/** Article + FAQPage schema, used when a page doesn't bring its own JSON-LD. */
export function defaultSchema(p: { title: string; meta_description: string; faq: FaqItem[]; published_at: string | null; updated_at: string }, url: string, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: p.title,
        description: p.meta_description,
        ...(p.published_at ? { datePublished: p.published_at } : {}),
        dateModified: p.updated_at,
        author: { '@type': 'Organization', name: 'TAAM', url: siteUrl },
        publisher: { '@type': 'Organization', name: 'TAAM', url: siteUrl },
        mainEntityOfPage: url,
      },
      ...(p.faq.length
        ? [
            {
              '@type': 'FAQPage',
              mainEntity: p.faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
            },
          ]
        : []),
    ],
  };
}

/** JSON-LD for a <script> tag, with "<" escaped so a page's text can't close the tag. */
export const jsonLdHtml = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
