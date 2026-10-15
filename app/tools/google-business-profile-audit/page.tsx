import type { Metadata } from 'next';
import { getTool, toolMetadata } from '@/app/lib/tools';
import ToolShell from '@/components/tools/ToolShell';
import GbpAudit from './GbpAudit';

const tool = getTool('google-business-profile-audit');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell
      tool={tool}
      headline={'Google profile\naudit.'}
      intro="Seventeen quick yes-or-no questions about your Google Business Profile. Answer honestly and you'll get a score, plus a ranked list of what's keeping you out of the map pack."
      guide={[
        {
          title: 'The map pack gets the calls',
          body: 'For "near me" and "in [city]" searches, the three map results at the top get a large share of the clicks and calls. Your Google Business Profile, not your website, decides whether you are in them.',
        },
        {
          title: 'Three things drive local rankings',
          body: "Google looks at relevance (does your profile match the search?), distance (how close are you?) and prominence (how well known and well reviewed are you?). You can't move your address, but categories, services, photos and reviews are all in your hands.",
        },
        {
          title: 'Reviews do double duty',
          body: 'Review count, recency and rating help you rank, and they are the first thing a searcher compares before calling. A steady routine of asking every happy customer beats any one-off push.',
        },
      ]}
      faqs={[
        {
          q: 'Do I need to log in or share access?',
          a: 'No. This is a self-audit. You answer from what you know about your profile, so nothing is connected and nothing is changed.',
        },
        {
          q: 'How is the score calculated?',
          a: 'Each item is weighted by how much it typically affects visibility and calls. Verification, primary category and review count count the most; quick wins like hours and posts count less.',
        },
        {
          q: 'How long does it take to see results after fixing my profile?',
          a: 'Simple fixes like categories, services and hours can be picked up within days to a few weeks. Review volume and recency build over months, which is why a steady routine matters.',
        },
        {
          q: 'What if I serve customers at their location?',
          a: "Service-area businesses can hide their street address and list the areas they serve instead. Everything else in this audit still applies.",
        },
      ]}
    >
      <GbpAudit />
    </ToolShell>
  );
}
