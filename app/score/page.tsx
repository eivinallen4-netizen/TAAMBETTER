import type { Metadata } from 'next';
import CallFlowScore from './CallFlowScore';
import { QUIZ, tradeFromParam } from '@/lib/score-quiz';
import { scoreAlertsOn } from '@/app/lib/score-config';

export const metadata: Metadata = {
  // Absolute so the layout's "| TAAM" isn't appended to an already-long title.
  title: { absolute: 'Call Flow Score | Free Marketing Assessment for Las Vegas Service Businesses' },
  description:
    'Answer 12 quick questions and get your Call Flow Score, the one gap costing you the most jobs, and a 90-day plan to fix it. Free, about 3 minutes.',
  alternates: { canonical: '/score' },
  openGraph: {
    title: 'Call Flow Score | Free Marketing Assessment',
    description: 'Get your Call Flow Score, your #1 gap and a 90-day plan to fix it. Free, about 3 minutes.',
    url: '/score',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'TAAM Call Flow Score' }],
  },
};

export default async function ScorePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const tradeRaw = Array.isArray(params.trade) ? params.trade[0] : params.trade;
  const trade = tradeFromParam(tradeRaw);
  // Only promise a fast call when someone actually gets the hot-lead alert.
  const hotLeadPromise = scoreAlertsOn() ? QUIZ.config.hotLeadPromise : '';
  return <CallFlowScore trade={trade?.value ?? ''} hotLeadPromise={hotLeadPromise} />;
}
