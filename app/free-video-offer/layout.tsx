import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Week of Video',
  description:
    'A full week of video content for your business, on us. Only for businesses that are already open and making sales.',
  alternates: { canonical: '/free-video-offer' },
};

export default function FreeVideoOfferLayout({ children }: { children: React.ReactNode }) {
  return children;
}
