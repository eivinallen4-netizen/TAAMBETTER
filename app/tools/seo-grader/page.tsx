import type { Metadata } from 'next';
import { getTool, toolMetadata } from '@/app/lib/tools';
import ToolShell from '@/components/tools/ToolShell';
import SeoGrader from './SeoGrader';

const tool = getTool('seo-grader');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell
      tool={tool}
      headline={'Free SEO\ngrader.'}
      intro="Paste any page from your site. In about ten seconds you'll get a score out of 100 and see every on-page check it passed or failed: title, description, headings, alt text, content, canonical tag, schema and more."
      guide={[
        {
          title: 'On-page SEO is the part you control',
          body: "You can't control Google's algorithm, but you can control what it reads. A clear title, one focused H1, enough helpful text and correct markup tell Google what a page is about and who it's for. Most small-business sites miss two or three of these, and many are quick fixes.",
        },
        {
          title: 'Grade the pages that make you money',
          body: 'Start with your homepage, then each service page and each city or area page. Those are the pages people land on when they search for what you do near them.',
        },
        {
          title: 'A score is a starting point',
          body: 'Rankings also depend on reviews, links, your Google Business Profile and how fast the page loads. Use this grader with the speed test and the Google Business Profile audit to see the whole picture.',
        },
      ]}
      faqs={[
        {
          q: 'What does the SEO grader check?',
          a: 'Whether the page can be indexed, HTTPS, title tag length, meta description length, H1 and H2 structure, image alt text, word count, the canonical tag, schema markup, the mobile viewport tag, Open Graph tags and the page language.',
        },
        {
          q: 'Is it really free?',
          a: 'Yes. Your score and every check are free, with no signup. If you want the detailed fix list, we ask for your email so a real person can follow up if you have questions.',
        },
        {
          q: 'Why is my score different from another tool?',
          a: 'Every grader weighs checks differently. We give the most weight to what most often holds back local and service businesses: indexability, titles, headings, content depth and schema.',
        },
        {
          q: 'Does it work with Wix, Squarespace or WordPress?',
          a: 'Yes. It reads the page the way a search engine does, so it works on any platform. Pages that load their text with JavaScript may show a lower word count than you see in the browser.',
        },
      ]}
    >
      <SeoGrader />
    </ToolShell>
  );
}
