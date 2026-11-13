import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import CrmEmbed from '@/components/CrmEmbed';

// Private pages sent to one person: never indexed, and the address is not passed on.
export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' };

export default function PublicCrmLayout({ children }: { children: ReactNode }) {
  return <CrmEmbed>{children}</CrmEmbed>;
}
