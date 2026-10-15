import type { Metadata } from 'next';
import { getTool, toolMetadata } from '@/app/lib/tools';
import ToolShell from '@/components/tools/ToolShell';
import SerpPreview from './SerpPreview';

const tool = getTool('serp-preview');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell
      tool={tool}
      headline={'SERP\npreview.'}
      intro="Type a title and description and see how your page will look in Google search results, on desktop and mobile. The bars show when you're about to get cut off."
      guide={[
        {
          title: 'Your search result is an ad you get for free',
          body: 'Ranking is only half the job. The title and description decide whether someone clicks you or the result below. Write them like ad copy: the service, the place, a proof point and a reason to click now.',
        },
        {
          title: 'Google cuts off by width, not characters',
          body: 'Results are truncated by pixel width, so a title full of wide letters (W, M, capitals) gets cut sooner than one with narrow ones. That is why this tool measures pixels as well as characters.',
        },
        {
          title: 'Front-load what matters',
          body: 'Put the main keyword and the most persuasive part first. If the end gets cut off on a phone, the searcher still sees what you do and why to pick you.',
        },
      ]}
      faqs={[
        {
          q: 'How long should a title tag be?',
          a: 'About 50–60 characters, or roughly 600 pixels on desktop. Longer titles get cut off with an ellipsis.',
        },
        {
          q: 'How long should a meta description be?',
          a: 'About 140–160 characters on desktop. On mobile Google shows less, so put the most important words first.',
        },
        {
          q: 'Why did Google change my title?',
          a: 'Google sometimes rewrites titles and descriptions it thinks do not match the page or the search. Titles that accurately describe the page, without keyword stuffing, are rewritten less often.',
        },
        {
          q: 'Is this exactly what Google will show?',
          a: 'It is a close approximation. Google tests its layout constantly and may add dates, ratings or site links, but the length limits here closely match what it shows today.',
        },
      ]}
    >
      <SerpPreview />
    </ToolShell>
  );
}
