import type { Metadata } from 'next';
import { getTool, toolMetadata } from '@/app/lib/tools';
import ToolShell from '@/components/tools/ToolShell';
import AdBudgetCalculator from './AdBudgetCalculator';

const tool = getTool('ad-budget-calculator');

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
  return (
    <ToolShell
      tool={tool}
      headline={'Ad budget\ncalculator.'}
      intro="Put in your budget, cost per click and conversion rates. See how many leads and customers that buys, what each one costs, and whether the ads actually make you money."
      guide={[
        {
          title: 'Budget is the least important number',
          body: "Most owners ask how much to spend. The better question is what a lead is worth. Once you know that, you know the most you can pay for a click, and the budget becomes a question of how fast you want to grow.",
        },
        {
          title: 'Small changes compound',
          body: 'Leads come from clicks × conversion rate, and customers come from leads × close rate. Improve each step a little and the result multiplies. A faster landing page and quicker follow-up often beat a bigger budget.',
        },
        {
          title: 'Use your real numbers',
          body: "The defaults are placeholders. Pull cost per click from your Google or Meta ads account, and estimate close rate from the last month or two of calls and form fills. The closer the inputs, the more useful the answer.",
        },
      ]}
      faqs={[
        {
          q: 'How do you calculate cost per lead?',
          a: 'Clicks are your budget divided by cost per click. Leads are clicks multiplied by your landing page conversion rate. Cost per lead is your budget divided by leads.',
        },
        {
          q: 'What is ROAS?',
          a: 'Return on ad spend: revenue from ads divided by what you spent. 3x means $3 in revenue for every $1 of ads. Whether that is profitable depends on your margin, which is why the calculator also shows profit after job costs.',
        },
        {
          q: 'What is a good landing page conversion rate?',
          a: 'It varies a lot by industry and offer. Pages built for one service with a clear call to action usually do far better than sending ad traffic to a homepage.',
        },
        {
          q: 'Does this work for Google Ads and Facebook Ads?',
          a: 'Yes. The math is the same for any platform that charges per click. For Local Services Ads, which charge per lead, enter your cost per lead as the cost per click and set the conversion rate to 100%.',
        },
      ]}
    >
      <AdBudgetCalculator />
    </ToolShell>
  );
}
