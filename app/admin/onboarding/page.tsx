import { redirect } from 'next/navigation';

// Onboarding is split into /admin/website and /admin/social; keep old bookmarks working.
export default function OnboardingIndex() {
  redirect('/admin');
}
