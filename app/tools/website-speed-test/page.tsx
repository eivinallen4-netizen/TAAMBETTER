import type { Metadata } from 'next';
import { getTool, toolMetadata } from '@/app/lib/tools';
import ToolShell from '@/components/tools/ToolShell';
import SpeedTest from './SpeedTest';

const tool = getTool('website-speed-test');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell
      tool={tool}
      headline={'Free speed\ntest.'}
      intro="See how fast your website loads on a phone and on a desktop, using Google's own PageSpeed test. You'll get your scores, your Core Web Vitals, and the fixes that would save the most time."
      guide={[
        {
          title: 'Slow sites lose calls',
          body: "Most local searches happen on a phone, often on a weak signal. If your page takes more than a few seconds to show anything, a lot of people hit back and call the next result. Speed is one of the cheapest conversion wins there is.",
        },
        {
          title: 'Google uses speed to rank',
          body: "Core Web Vitals (how fast the main content appears, how much the layout jumps, and how quickly the page responds to taps) are part of Google's ranking signals. Two sites with similar content? The faster one has the edge.",
        },
        {
          title: 'Mobile is the score that matters',
          body: "Google ranks the mobile version of your site, and the mobile test simulates a mid-range phone on a slower connection. That's why mobile scores are almost always lower than desktop. Fix for mobile first.",
        },
      ]}
      faqs={[
        {
          q: 'Where do these scores come from?',
          a: "From Google PageSpeed Insights, the same Lighthouse test Google publishes. We run it for mobile and desktop at the same time and translate the results into plain English.",
        },
        {
          q: 'What is a good PageSpeed score?',
          a: '90 or above is good, 50 to 89 needs improvement, and under 50 is poor. Many small-business sites score 30–60 on mobile, so most have room to win easy ground on competitors.',
        },
        {
          q: 'Why does my score change each time I test?',
          a: 'Network conditions, server load and third-party scripts vary between runs, so scores can move a few points. Look at the trend and at the fix list rather than a single number.',
        },
        {
          q: 'What are Core Web Vitals?',
          a: "Google's measures of real-world page experience: Largest Contentful Paint (how fast the main content shows), Cumulative Layout Shift (how much things jump around) and Interaction to Next Paint (how quickly the page responds).",
        },
      ]}
    >
      <SpeedTest />
    </ToolShell>
  );
}
