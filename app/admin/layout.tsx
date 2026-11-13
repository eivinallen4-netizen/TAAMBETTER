import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import CrmEmbed from '@/components/CrmEmbed';

// /admin is the TAAM CRM (@taam/crm, configured in /crm.ts). The catch-all page next to this
// file draws its screens; the website's own tools (pages, slides, video offers) are the folders
// beside it, each framed by the CRM's menu through its layout.tsx.

export const metadata: Metadata = { title: 'CRM', robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <CrmEmbed>{children}</CrmEmbed>;
}
