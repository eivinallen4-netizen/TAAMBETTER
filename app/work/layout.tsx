import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio | TAAM - Content Marketing & Digital Strategy',
  description: 'See how TAAM has helped brands build content strategies that grow their business. Portfolio of digital marketing, branding, and content creation projects.',
};

export default function WorkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
