import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import siteContent from './content/siteContent.json';
import ContactCTA from './components/ContactCTA';
import Marquee from '@/components/editorial/Marquee';
import { avantGuardCredit, maintenanceAmericaCredit } from '@/components/editorial/ShortCredit';
import HomeHero from '@/components/sections/HomeHero';
import OfferSection from '@/components/sections/OfferSection';
import WorkSection from '@/components/sections/WorkSection';
import WorkedWithStrip from '@/components/sections/WorkedWithStrip';
import TestimonialsSection, { type Testimonial } from '@/components/sections/TestimonialsSection';
import ProcessSection from '@/components/sections/ProcessSection';
import FitSection from '@/components/sections/FitSection';
import CTASection from '@/components/sections/CTASection';
import StickyTalkBar from '@/components/sections/StickyTalkBar';
import Arrow from '@/components/editorial/Arrow';
import { SITE_URL } from '@/lib/site-url';

export const metadata: Metadata = {
  title: "TAAM | Better Marketing for the Best Businesses",
  description: "30 videos a month, more customers. Planned, filmed, edited and posted by one Las Vegas team. First videos live within 14 days. Month to month, no contract.",
  openGraph: {
    title: "TAAM | Better Marketing for the Best Businesses",
    description: "30 videos a month, more customers. First videos live within 14 days. Month to month, no contract.",
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
    canonical: SITE_URL,
  },
};

/** The 30-Video Month guarantee. It adds work, never money back: TAAM doesn't cut prices. */
const GUARANTEE = 'First videos live in 14 days, or we keep filming at no extra charge until they are.';

/**
 * Named client quotes. The section stays hidden while this is empty. Real quotes only, each with a
 * result in it, e.g. { quote: '[What changed, in their words]', name: '[Name]', business: '[Business]' }.
 */
const TESTIMONIALS: Testimonial[] = [];

/** One line per step on the homepage; the About page keeps the full story. */
const SHORT_PROCESS: Record<string, string> = {
  '01': "We find out exactly why the right people aren't seeing you yet.",
  '02': 'We agree on what winning looks like, in real numbers, before we film a thing.',
  '03': 'One team plans, films and edits work your customers actually stop for.',
  '04': "We measure every month, do more of what works and change what doesn't.",
};

export default function Home() {
  const content = siteContent;
  const hero = content.hero.home;
  const publishedProjects = content.projects.filter((p) => p.published !== false);
  const featured = publishedProjects[0];
  const featuredResult = featured?.results?.[0];
  const featuredNoAds = featured?.results?.some((r) => r.label.toLowerCase() === 'ad spend' && r.value === '$0');
  const featuredStill = featured?.videos?.[0]?.src.replace(/\.mp4$/, '.jpg');
  const ctaLabel = hero.buttonText;

  return (
    <>
      {/* Conversion path: promise + proof on the first screen -> the named offer (price, speed, commitment)
          -> the work -> "is this you?" -> how we work -> the ask. Sections alternate orange / ink. */}
      <HomeHero
        eyebrow={hero.eyebrow}
        eyebrowRight="Better marketing for the best businesses"
        title={hero.title}
        fillFrom={2}
        subtitle={hero.subtitle}
        stats={content.stats}
        image={{ src: hero.imageSrc, video: hero.videoSrc, alt: 'An Avant Guard short TAAM filmed and edited: a supercar rolling off the delivery truck' }}
        pillLabel="Filmed by TAAM"
        caption={
          <>
            Filmed and edited by TAAM for{' '}
            <a href={avantGuardCredit.href} target="_blank" rel="noopener noreferrer" className="link-line">
              Avant Guard Coatings
            </a>
            , Las Vegas: a supercar rolling off the delivery truck, cut for their socials.
          </>
        }
        actions={
          <>
            <ContactCTA className="btn btn-solid shrink-0 self-start sm:self-auto">
              {ctaLabel} <Arrow />
            </ContactCTA>
            <p className="max-w-sm text-sm font-semibold leading-snug text-[color:var(--tone-muted)]">
              {GUARANTEE} Month to month, no contract. Or call{' '}
              <a href={`tel:${content.contact.phone.replace(/[^+\d]/g, '')}`} className="link-line text-white">
                {content.contact.phone}
              </a>
              .
            </p>
          </>
        }
        proof={
          featured && featuredResult && (
            <Link
              href={`/work/${featured.id}`}
              className="group flex w-full items-center gap-4 rounded-2xl bg-[color:var(--taam-near-black)] p-2 pr-4 shadow-[0_20px_50px_rgb(0_0_0/0.3)] transition hover:bg-black"
            >
              {featuredStill && (
                <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl">
                  <Image src={featuredStill} alt="" fill sizes="48px" className="object-cover" />
                </span>
              )}
              <span className="text-sm font-semibold leading-snug">
                <span className="eyebrow block text-[0.62rem] mb-1 text-[color:var(--tone-muted)]">Latest result</span>
                {featured.title}: {featuredResult.from} to {featuredResult.value} {featuredResult.label.toLowerCase()}
                {featuredNoAds && ', $0 in ads'}. <span className="whitespace-nowrap underline underline-offset-2">See how <Arrow /></span>
              </span>
            </Link>
          )
        }
      />

      <div className="overflow-x-clip">
        <div className="ribbon">
          <Marquee items={['Say WOW', 'Proven team', 'Always hungry', 'Las Vegas']} />
        </div>
      </div>

      <OfferSection
        index="01"
        ctaLabel={ctaLabel}
        guarantee={GUARANTEE}
        bonus="A fresh photo set for your Google Business Profile, shot the same day as your first videos."
        capacity="One film crew, so we take on 3 new businesses a month."
        terms={[
          {
            label: 'What you get',
            value: '30 + 3',
            detail: '30 short videos and 3 long-form every month. Strategy, on-location shoots, editing and posting included.',
          },
          {
            label: 'What it costs',
            value: '$3,000/mo',
            detail: 'Tighter budget? We trim the scope, not the rates: $2,500 gets 30 shorts and 1 long-form.',
          },
          {
            label: 'How fast',
            value: '14 days',
            detail: 'From kickoff to your first videos going live. Growth compounds over a few months, against numbers we agree on up front.',
          },
          {
            label: 'Commitment',
            value: 'Month to month',
            detail: "No long-term contract. You stay because it's working, not because you signed for a year.",
          },
        ]}
      />

      <WorkedWithStrip />

      <TestimonialsSection quotes={TESTIMONIALS} />

      <WorkSection projects={publishedProjects} index="02" showReels ctaLabel={ctaLabel} />

      <FitSection index="03" ctaLabel={ctaLabel} />

      <ProcessSection steps={content.process.map((s) => ({ ...s, description: SHORT_PROCESS[s.step] ?? s.description }))} tone="ink" index="04" image={{ src: '/media/ma-shop.jpg', video: '/media/ma-shop.mp4', alt: 'A Maintenance America LV short TAAM filmed in their Las Vegas shop', credit: maintenanceAmericaCredit }} />

      <CTASection
        title={content.homepage.ctaText}
        email={content.contact.email}
        headline={'Give us\na call.'}
        buttonLabel={ctaLabel}
        phone={content.contact.phone}
        description="Don't let a ten-year relationship with your agency, or the employee you handed social media to, stop your company from passing the goals you set. We'll see if we can give you better marketing. If we can't, we'll refer you to someone who can."
        nextSteps={[
          'Answer a few quick questions. About two minutes.',
          "Look like a fit? Pick your call time right there. If not, a real person replies within 1 business day.",
          "If we're the right team, we show you what we'd do first. If we're not, we refer you to someone who is.",
        ]}
        faqs={[
          {
            q: 'What does it cost?',
            a: "Most clients start with the 30-Video Month at $3,000 a month: 30 short videos and 3 long-form videos. From there we add or take things away based on what you need and what you can afford. Have $2,500? We'd do 30 shorts and 1 long-form. What we don't do is discounts. We believe in the quality of the work, and if we ever want to do you a favor, we'll just do it for free.",
          },
          {
            q: 'Is there a contract?',
            a: "No long-term contract. It's month to month. If the work isn't earning its keep, you can stop, and we'd rather earn the next month than lock you into it.",
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
            a: "Your first videos go live within 14 days of kickoff. Results take longer: content compounds, and it takes a few months to show what it can do. We decide what winning looks like in real numbers before we make anything. If you need results in two weeks, we're not the right fit.",
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
