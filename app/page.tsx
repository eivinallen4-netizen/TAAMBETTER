import type { Metadata } from 'next';
import Link from 'next/link';
import siteContent from './content/siteContent.json';
import ContactCTA from './components/ContactCTA';
import Marquee from '@/components/editorial/Marquee';
import { maintenanceAmericaCredit } from '@/components/editorial/ShortCredit';
import HomeHero from '@/components/sections/HomeHero';
import ManifestoSection from '@/components/sections/ManifestoSection';
import ServicesSection from '@/components/sections/ServicesSection';
import WorkSection from '@/components/sections/WorkSection';
import ProcessSection from '@/components/sections/ProcessSection';
import FitSection from '@/components/sections/FitSection';
import CTASection from '@/components/sections/CTASection';
import StickyTalkBar from '@/components/sections/StickyTalkBar';
import Arrow from '@/components/editorial/Arrow';

export const metadata: Metadata = {
  title: "TAAM | Better Marketing for the Best Businesses",
  description: "Creative that makes your customers say WOW. TAAM is a proven content marketing team in Las Vegas: strategy, video, social and web for businesses that are already great at what they do.",
  openGraph: {
    title: "TAAM | Better Marketing for the Best Businesses",
    description: "You already got good at what you do. We show it to the people who need to see it.",
    type: "website",
    images: [
      {
        url: "/og-home.png",
        width: 1200,
        height: 630,
        alt: "TAAM - Content Marketing Agency",
      },
    ],
  },
  alternates: {
    canonical: "https://taammarketing.com",
  },
};

export default function Home() {
  const content = siteContent;
  const hero = content.hero.home;
  const publishedProjects = content.projects.filter((p) => p.published !== false);
  const featured = publishedProjects[0];
  const featuredResult = featured?.results?.[0];

  return (
    <>
      {/* Conversion path: promise -> proof -> "is this you?" -> what we do -> how -> low-risk ask.
          Sections alternate orange / ink with white type throughout. */}
      <HomeHero
        title={hero.title}
                fillFrom={2}
        subtitle={hero.subtitle}
        stats={content.stats}
        image={{ src: hero.imageSrc, video: hero.videoSrc, alt: 'Guests mingling at A Night of Connection & Cocktails, a real estate networking event TAAM filmed at the Rouge Room, Red Rock Casino' }}
        pillLabel="Filmed by TAAM"
        caption={
          <>
            Filmed and promoted by TAAM: A Night of Connection &amp; Cocktails at the Rouge Room, Red Rock. Thanks to
            our host, Chris, for bringing us in, and to{' '}
            <a href="https://www.instagram.com/endybrosmusic/" target="_blank" rel="noopener noreferrer" className="link-line">
              Endy Bros
            </a>{' '}
            on the decks.
          </>
        }
        actions={
          <>
            <ContactCTA className="btn btn-solid">
              {hero.buttonText} <Arrow />
            </ContactCTA>
            <Link href="/work" className="btn btn-ghost">See the work</Link>
            <p className="w-full text-sm font-semibold text-[color:var(--tone-muted)]">
              Two minutes. A real person replies within 1 business day. Or call{' '}
              <a href={`tel:${content.contact.phone.replace(/[^+\d]/g, '')}`} className="link-line text-white">
                {content.contact.phone}
              </a>
              .
            </p>
          </>
        }
        note={
          featured && featuredResult ? (
            <Link href={`/work/${featured.id}`} className="link-line">
              {featured.title}: {featuredResult.from} to {featuredResult.value} {featuredResult.label.toLowerCase()}
              {featured.results?.some((r) => r.label.toLowerCase() === 'ad spend' && r.value === '$0') && ', $0 in ads'}. See how <Arrow />
            </Link>
          ) : undefined
        }
      />

      <div className="overflow-x-clip">
        <div className="ribbon">
          <Marquee items={['Say WOW', 'Proven team', 'Always hungry', 'Las Vegas']} />
        </div>
      </div>

      <WorkSection projects={publishedProjects} index="01" showReels />

      <FitSection index="02" />

      <div className="tone-ink pt-16 md:pt-24">
        <Marquee items={['Strategy', 'Video', 'Social', 'Web']} />
      </div>

      <ManifestoSection
        statement={content.homepage.statement}
        description={content.homepage.description}
        stats={content.stats}
        index="03"
      />

      <ServicesSection services={content.company.services} index="04" />

      <ProcessSection steps={content.process} tone="ink" index="05" image={{ src: '/media/ma-shop.jpg', video: '/media/ma-shop.mp4', alt: 'A Maintenance America LV short TAAM filmed in their Las Vegas shop', credit: maintenanceAmericaCredit }} />

      <CTASection
        title={content.homepage.ctaText}
        email={content.contact.email}
        headline={'Give us\na call.'}
        buttonLabel="Let's talk"
        phone={content.contact.phone}
        description="Don't let a ten-year relationship with your agency, or the employee you handed social media to, stop your company from passing the goals you set. We'll see if we can give you better marketing. If we can't, we'll refer you to someone who can."
        nextSteps={[
          'Answer a few quick questions. About two minutes.',
          'We review your business and reply within 1 business day.',
          "If we're the right team, we show you what we'd do first. If we're not, we refer you to someone who is.",
        ]}
        faqs={[
          {
            q: 'What does it cost?',
            a: "Most clients start at $3,000 a month for our organic package: 30 short videos and 3 long-form videos. From there we add or take things away based on what you need and what you can afford. Have $2,500? We'd do 30 shorts and 1 long-form. What we don't do is discounts. We believe in the quality of the work, and if we ever want to do you a favor, we'll just do it for free.",
          },
          {
            q: 'What do you actually do each month?',
            a: (
              <>
                Whatever the plan calls for. For{' '}
                <Link href={featured ? `/work/${featured.id}` : '/work'} className="link-line">Discount Drain Cleaning</Link>{' '}
                that meant a content strategy, weekly on-location shoots, 30 reels a month, editing and community
                management, all from one team.
              </>
            ),
          },
          {
            q: 'How fast will I see results?',
            a: "Content compounds. It takes a few months to show what it can do, and we decide what winning looks like in real numbers before we make anything. If you need results in two weeks, we're not the right fit.",
          },
          {
            q: 'Do I have to be on camera?',
            a: "You or your team, yes. The best content is your real people doing real work. We come to you and run the shoot. Discount Drain's plumbers became the personalities, and that's what people tuned in for.",
          },
          {
            q: "What if you're not the right fit?",
            a: (
              <>
                We&apos;ll say so, and we&apos;ll refer you to someone who is. Not open yet? Start with our{' '}
                <Link href="/tools" className="link-line">free tools</Link>. Already open and selling? You may
                qualify for a{' '}
                <Link href="/free-video-offer" className="link-line">free week of video</Link>.
              </>
            ),
          },
          {
            q: 'Will I get spammed if I fill out the form?',
            a: 'No. No newsletter, no list. Your answers go to our team and nowhere else, and a real person reads every one.',
          },
        ]}
      />

      <StickyTalkBar phone={content.contact.phone} />
    </>
  );
}
