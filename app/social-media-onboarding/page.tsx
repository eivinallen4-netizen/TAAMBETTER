import { Metadata } from 'next';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SocialMediaOnboardingForm from './SocialMediaOnboardingForm';
import Header from './Header';

export const metadata: Metadata = {
  title: 'Social Media Onboarding',
  description: 'Connect your social media accounts for managed marketing',
};

export default async function SocialMediaOnboardingPage() {
  const session = await getSession();

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-taam-near-black text-white py-12 px-6">
      <Header />
      <SocialMediaOnboardingForm />
    </div>
  );
}
