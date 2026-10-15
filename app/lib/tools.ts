import type { Metadata } from 'next';
import type { IconName } from '@/components/editorial/Icon';

// Free lead-magnet tools. Each gets its own landing page under /tools/<slug> (ranks on "free <tool>"
// searches), shows its headline result free, and gates the detailed fix list behind an email.

export interface FreeTool {
  slug: string;
  /** Short name for cards and nav. */
  name: string;
  /** What the visitor gets, one line. */
  pitch: string;
  /** SEO title (the layout appends "| TAAM"). */
  metaTitle: string;
  metaDescription: string;
  icon: IconName;
  /** Prefills the contact form's "biggest challenge" when someone clicks the end-of-result CTA. */
  challenge: string;
  services: string[];
  /** The question that opens the ask at the end of every result. */
  ctaQuestion: string;
}

export const FREE_TOOLS: FreeTool[] = [
  {
    slug: 'website-speed-test',
    name: 'Website speed test',
    pitch: 'Mobile and desktop scores, Core Web Vitals and the fixes that matter most.',
    metaTitle: 'Free Website Speed Test (Mobile + Desktop)',
    metaDescription:
      'Test your website speed for free. Get mobile and desktop scores, Core Web Vitals, and a plain-English list of what to fix first. Powered by Google PageSpeed data.',
    icon: 'optimization',
    challenge: 'website',
    services: ['website_dev'],
    ctaQuestion: 'Want us to make it fast?',
  },
  {
    slug: 'seo-grader',
    name: 'On-page SEO grader',
    pitch: 'Grades titles, headings, alt text, schema and more on any page in seconds.',
    metaTitle: 'Free On-Page SEO Checker & Grader',
    metaDescription:
      'Grade any page for on-page SEO in seconds. Checks title tag, meta description, H1/H2 structure, image alt text, word count, canonical tag and schema markup.',
    icon: 'find',
    challenge: 'website',
    services: ['website_dev', 'marketing_mgmt'],
    ctaQuestion: 'Want us to fix it?',
  },
  {
    slug: 'ad-budget-calculator',
    name: 'Ad budget & lead calculator',
    pitch: 'See how many leads your ad budget buys, what each one costs, and what it returns.',
    metaTitle: 'Free Ad Budget, Cost Per Lead & ROAS Calculator',
    metaDescription:
      'Estimate leads, cost per lead, customers and return on ad spend from your budget, CPC and conversion rate. Free calculator for service businesses.',
    icon: 'campaign',
    challenge: 'leads',
    services: ['marketing_mgmt'],
    ctaQuestion: 'Want a plan to hit these numbers?',
  },
  {
    slug: 'google-business-profile-audit',
    name: 'Google Business Profile audit',
    pitch: 'A two-minute self-check that scores your profile and shows what is costing you calls.',
    metaTitle: 'Free Google Business Profile Audit & Checklist',
    metaDescription:
      'Score your Google Business Profile in two minutes. A free self-audit checklist for local businesses that shows exactly what to fix to win more map-pack calls.',
    icon: 'prove',
    challenge: 'leads',
    services: ['marketing_mgmt', 'social_media'],
    ctaQuestion: 'Want us to optimize it?',
  },
  {
    slug: 'serp-preview',
    name: 'Google SERP preview',
    pitch: 'Write titles and descriptions that fit, with a live preview of your Google result.',
    metaTitle: 'Free SERP Preview & Meta Tag Length Checker',
    metaDescription:
      'Preview how your page will look in Google search results. Live character and pixel-width counts for title tags and meta descriptions, on desktop and mobile.',
    icon: 'strategy',
    challenge: 'website',
    services: ['website_dev'],
    ctaQuestion: 'Want pages that rank and convert?',
  },
];

export function getTool(slug: string): FreeTool {
  const tool = FREE_TOOLS.find((t) => t.slug === slug);
  if (!tool) throw new Error(`Unknown tool: ${slug}`);
  return tool;
}

export function toolMetadata(tool: FreeTool): Metadata {
  const path = `/tools/${tool.slug}`;
  return {
    title: tool.metaTitle,
    description: tool.metaDescription,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      title: `${tool.metaTitle} | TAAM`,
      description: tool.metaDescription,
      url: path,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${tool.name} by TAAM` }],
    },
  };
}
