import type { Metadata } from 'next';
import siteContent from '../content/siteContent.json';
import ContactCTA from '../components/ContactCTA';
import PageHero from '@/components/sections/PageHero';
import ManifestoSection from '@/components/sections/ManifestoSection';
import ServicesSection from '@/components/sections/ServicesSection';
import ProcessSection from '@/components/sections/ProcessSection';
import Section from '@/components/editorial/Section';
import Headline from '@/components/editorial/Headline';
import MediaCard from '@/components/editorial/MediaCard';
import Reveal from '@/components/editorial/Reveal';
import { maintenanceAmericaCredit } from '@/components/editorial/ShortCredit';
import Arrow from '@/components/editorial/Arrow';
import { SITE_URL } from '@/lib/site-url';

export const metadata: Metadata = {
  title: "About TAAM | Content Marketing Agency",
  description: "A proven Las Vegas content marketing team, hungry for the next big problem. We can't make you good at what you do. We show it to the people who need to see it.",
  openGraph: {
    title: "About TAAM | Our Story & Team",
    description: "Better marketing for the best businesses. Meet the team that makes your customers say WOW.",
    type: "website",
    images: [
      {
        url: "/og-about.png",
        width: 1200,
        height: 630,
        alt: "About TAAM",
      },
    ],
  },
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
};

export default function About() {
  const content = siteContent;
  const hero = content.hero.about;

  return (
    <>
      <PageHero
        eyebrow="About TAAM"
        title={hero.title}
        outlineFrom={2}
        subtitle={hero.subtitle}
        image={{ src: hero.imageSrc, video: hero.videoSrc, alt: 'Guests at A Night of Connection & Cocktails, a real estate networking event TAAM filmed at the Rouge Room, Red Rock Casino' }}
        actions={
          <ContactCTA className="btn btn-solid">
            Work with us <Arrow />
          </ContactCTA>
        }
      />

      <ManifestoSection
        index="01"
        label="Who we are"
        statement={content.homepage.statement}
        description={content.company.description}
        stats={content.stats}
      />

      <ServicesSection services={content.company.services} showMoreLink={false} />

      <Section tone="ink" index="03" label="The standard">
        <div className="grid grid-cols-12 gap-x-6 gap-y-14">
          <Reveal className="col-span-12 md:col-span-6 lg:col-span-5" y={60}>
            <MediaCard src="/media/ma-invoice.jpg" video="/media/ma-invoice.mp4" alt="A Maintenance America LV short TAAM made: the client who says they're going to pay the invoice" credit={maintenanceAmericaCredit} aspect="aspect-[4/5]" sizes="(min-width: 768px) 45vw, 100vw" />
          </Reveal>
          <div className="col-span-12 md:col-span-6 lg:col-span-6 lg:col-start-7 self-end">
            <Headline text={'Loyalty\nisn\'t a\nstrategy.'} outlineFrom={2} className="display-lg" />
            <Reveal className="mt-10 max-w-lg">
              <p className="lede text-[color:var(--tone-muted)]">
                Don&apos;t let a ten-year relationship with your marketing agency, or the employee you handed social
                media to, be the reason your company stops growing. Every project we take on gets a clear goal and a
                way to measure it. If it isn&apos;t working, we change it. If we&apos;re not the right team, we&apos;ll
                tell you who is.
              </p>
            </Reveal>
          </div>
        </div>
      </Section>

      <ProcessSection steps={content.process} index="04" image={{ src: '/media/ma-too-busy.jpg', video: '/media/ma-too-busy.mp4', alt: 'A Maintenance America LV short TAAM made: the client who is too busy to pay', credit: maintenanceAmericaCredit }} />

    </>
  );
}
