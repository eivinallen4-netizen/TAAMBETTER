import type { Metadata } from 'next';
import { crm } from '@/crm';

// A client's onboarding form. Links already sent use /onboarding/<token>; the CRM's onboarding
// page (also at /c/onboarding/<token>) answers them with the same token.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Client onboarding' };

export default async function OnboardingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <crm.PublicPage params={Promise.resolve({ path: ['onboarding', token] })} />;
}
