import type { ReactNode } from 'react';
import Link from 'next/link';
import Headline from '@/components/editorial/Headline';
import Icon from '@/components/editorial/Icon';
import Reveal from '@/components/editorial/Reveal';
import Section from '@/components/editorial/Section';
import { FREE_TOOLS, type FreeTool } from '@/app/lib/tools';
import { SITE_URL } from '@/lib/site-url';

const baseUrl = SITE_URL;

export interface ToolFaq {
  q: string;
  a: string;
}

interface ToolShellProps {
  tool: FreeTool;
  /** Poster headline, lines separated by "\n". */
  headline: string;
  intro: string;
  /** The interactive tool itself. */
  children: ReactNode;
  /** Short "why this matters" paragraphs under the tool, for searchers and for trust. */
  guide: { title: string; body: string }[];
  faqs: ToolFaq[];
}

/**
 * Landing page frame shared by every free tool: an orange opener that gets straight to the tool,
 * the tool on ink, then an orange guide + FAQ (useful content that ranks) and links to the other tools.
 * Ends on orange so the ink footer keeps the alternation.
 */
export default function ToolShell({ tool, headline, intro, children, guide, faqs }: ToolShellProps) {
  const url = `${baseUrl}/tools/${tool.slug}`;
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: `${tool.name} by TAAM`,
      url,
      description: tool.metaDescription,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Any',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      provider: { '@type': 'Organization', name: 'TAAM', url: baseUrl },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
        { '@type': 'ListItem', position: 2, name: 'Free tools', item: `${baseUrl}/tools` },
        { '@type': 'ListItem', position: 3, name: tool.name, item: url },
      ],
    },
  ];

  const others = FREE_TOOLS.filter((t) => t.slug !== tool.slug);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="tone-orange relative overflow-clip">
        {/* Kept short so the tool itself starts above the fold on a laptop screen. */}
        <div className="gutter pt-28 md:pt-32 pb-12 md:pb-16">
          <nav aria-label="Breadcrumb" className="eyebrow mb-8 md:mb-10 flex flex-wrap gap-x-3 gap-y-1">
            <Link href="/tools" className="link-line">Free tools</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{tool.name}</span>
          </nav>
          <div className="grid grid-cols-12 gap-x-6 gap-y-8 items-end">
            <Headline as="h1" immediate text={headline} outlineFrom={1} className="display-lg col-span-12 lg:col-span-7" />
            <Reveal className="col-span-12 md:col-span-8 lg:col-span-5" delay={0.3}>
              <p className="lede">{intro}</p>
              <p className="mt-6 text-sm font-semibold text-[color:var(--tone-muted)]">
                100% free · No signup to run it · Built by TAAM, a Las Vegas marketing team
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="tone-ink relative" id="tool">
        <div className="gutter py-16 md:py-24">{children}</div>
      </section>

      <Section tone="orange" label="Guide" index="01">
        <div className="grid grid-cols-12 gap-x-6 gap-y-14">
          <div className="col-span-12 lg:col-span-5">
            <Headline text={'Why it\nmatters.'} outlineFrom={1} className="display-lg" />
          </div>
          <div className="col-span-12 lg:col-span-6 lg:col-start-7 space-y-10">
            {guide.map((g) => (
              <Reveal key={g.title}>
                <h2 className="display display-sm mb-4">{g.title}</h2>
                <p className="text-lg leading-relaxed font-medium">{g.body}</p>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mt-24 md:mt-32 grid grid-cols-12 gap-x-6 gap-y-10">
          <h2 className="col-span-12 lg:col-span-5 display display-md">Questions</h2>
          <div className="col-span-12 lg:col-span-7 border-t-2 rule">
            {faqs.map((f) => (
              <details key={f.q} className="group border-b-2 rule py-6">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-lg md:text-xl font-bold leading-snug [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden="true" className="text-2xl leading-none transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-4 text-lg leading-relaxed font-medium text-[color:var(--tone-muted)]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-24 md:mt-32">
          <p className="eyebrow mb-6">More free tools</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 border-t-2 rule">
            {others.map((t) => (
              <li key={t.slug} className="border-b-2 rule">
                <Link href={`/tools/${t.slug}`} className="group flex items-center gap-4 py-6">
                  <Icon name={t.icon} className="w-8 h-8 shrink-0" />
                  <span className="font-bold leading-snug link-line">{t.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
