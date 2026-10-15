import type { Metadata } from 'next';
import OnboardingFlow from './OnboardingFlow';

export const metadata: Metadata = {
  title: 'Client onboarding | TAAM',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function OnboardingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <OnboardingFlow token={token} />;
}
