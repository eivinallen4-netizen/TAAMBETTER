import type { Metadata } from 'next';
import Link from 'next/link';
import siteContent from '../content/siteContent.json';
import { FREE_TOOLS } from '@/app/lib/tools';
import Icon from '@/components/editorial/Icon';
import Reveal from '@/components/editorial/Reveal';
import Section from '@/components/editorial/Section';
import PageHero from '@/components/sections/PageHero';
import CTASection from '@/components/sections/CTASection';
import Arrow from '@/components/editorial/Arrow';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://taammarketing.com';

export const metadata: Metadata = {
  title: 'Free Marketing Tools for Small Businesses',
  description:
    'Free website speed test, SEO grader, ad budget calculator, Google Business Profile audit and SERP preview. Instant results, no signup, built by TAAM in Las Vegas.',
  alternates: { canonical: '/tools' },
  openGraph: {
    title: 'Free Marketing Tools for Small Businesses | TAAM',
    description: 'Check your website speed, SEO, ad budget and Google Business Profile in minutes. Free, no signup.',
    url: '/tools',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Free marketing tools by TAAM' }],
  },
};

export default function ToolsPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Free marketing tools by TAAM',
    itemListElement: FREE_TOOLS.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${baseUrl}/tools/${t.slug}`,
      name: t.name,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <PageHero
        eyebrow="Free tools"
        title={'Check it\nyourself.'}
        outlineFrom={1}
        size="lg"
        subtitle="The same checks we run before we pitch a client, free. Find out what's slowing your site, hiding you from Google or wasting your ad budget, then fix it yourself or hand it to us."
        note="No signup to run any tool. Results in seconds."
      />

      <Section tone="ink" index="01" label="Tools">
        <ol className="border-t-2 rule">
          {FREE_TOOLS.map((t, i) => (
            <Reveal as="li" key={t.slug} delay={i * 0.05} className="group border-b-2 rule">
              <Link href={`/tools/${t.slug}`} className="grid grid-cols-12 items-center gap-x-6 gap-y-4 py-8 md:py-10">
                <span className="col-span-2 md:col-span-1 eyebrow">{String(i + 1).padStart(2, '0')}</span>
                <h2 className="col-span-10 md:col-span-6 display display-md hover-outline">{t.name}</h2>
                <p className="col-span-10 col-start-3 md:col-span-4 md:col-start-auto text-base md:text-lg leading-relaxed font-medium">
                  {t.pitch} <span className="font-bold whitespace-nowrap">Try it <Arrow /></span>
                </p>
                <Icon
                  name={t.icon}
                  className="hidden md:block col-span-1 justify-self-end w-11 h-11 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-90"
                />
              </Link>
            </Reveal>
          ))}
        </ol>
      </Section>

      <CTASection
        title="Rather we just look at it?"
        headline={"We'll\nlook.\nFree."}
        email={siteContent.contact.email}
        buttonLabel="Get free recommendations"
        description="Tell us about the business and we'll review your site, your Google profile and your ads ourselves, then tell you the three things we'd fix first. No pitch deck, no obligation."
        nextSteps={[
          'Answer a few quick questions. About two minutes.',
          'We review your business and reply within 1 business day.',
          "If it's a fit, we get on a short call and show you what we'd do first.",
        ]}
      />
    </>
  );
}
