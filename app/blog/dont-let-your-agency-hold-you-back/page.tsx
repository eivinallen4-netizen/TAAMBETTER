import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import ContactCTA from '../../components/ContactCTA';
import PageHero from '@/components/sections/PageHero';
import Section from '@/components/editorial/Section';
import Arrow from '@/components/editorial/Arrow';
import Tower from '../Tower';
import Street from '../Street';
import { SITE_URL } from '@/lib/site-url';

const url = `${SITE_URL}/blog/dont-let-your-agency-hold-you-back`;

export const metadata: Metadata = {
  title: "Don't Let Your Marketing Agency Hold You Back",
  description: "Ten years with the same agency? Social handed to whoever had time? The signs your marketing is holding you back, and what better marketing looks like.",
  openGraph: {
    title: "Don't Let Your Marketing Agency Hold You Back",
    description: 'The signs your marketing is holding you back, and what better marketing looks like.',
    type: 'article',
    url,
  },
  alternates: { canonical: url },
};

const faqs = [
  {
    q: 'How do you know your marketing agency is holding you back?',
    a: "Your agency is holding you back when your business is growing faster than your marketing is. If the reports look the same every month, the content looks the same every year, and nobody can tell you in real numbers what winning looks like, that's your answer.",
  },
  {
    q: 'Why do businesses stay with an agency that isn\'t working?',
    a: "Mostly because it's comfortable. After ten years the agency has your logins, your logo files and your habits, and switching feels like more work than staying.",
  },
  {
    q: 'What about the employee you handed social media to?',
    a: "Handing social to someone on your team is how most businesses start, and there's nothing wrong with that. The problem is when it never grows up: they're doing it between their real job, without a plan, a camera crew or anyone telling them what's working.",
  },
  {
    q: 'How do you switch marketing agencies without losing momentum?',
    a: 'Switch in order: get your accounts and files in your own name first, agree on goals in real numbers with the new team, then give your old agency notice. Most of the pain of switching comes from doing those steps backwards.',
  },
  {
    q: 'How long until you see results from a new agency?',
    a: "Content compounds, so give it a few months to show what it can do. Decide what winning looks like in real numbers on day one, so you're judging results instead of vibes.",
  },
];

const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: "Don't Let Your Marketing Agency Hold You Back",
      description: 'The signs your marketing agency (or the employee you handed social media to) is holding your business back, and what better marketing looks like.',
      datePublished: '2026-10-16',
      dateModified: '2026-10-16',
      author: { '@type': 'Organization', name: 'TAAM', url: SITE_URL },
      publisher: { '@type': 'Organization', name: 'TAAM', url: SITE_URL },
      mainEntityOfPage: url,
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

const signs = [
  ['Same report, different date.', 'The numbers move a little, the advice never changes.'],
  ["You can't remember their last big idea.", "Every new thing they've done, you had to ask for."],
  ['Your posts could belong to anyone.', "Swap your logo for a competitor's and nobody would notice."],
  ['"Engagement" is the headline.', 'Calls, bookings and sales never come up.'],
  ["You're doing the creative thinking.", "You're paying a retainer and still writing the captions in your head."],
];

const comparison = [
  ['The same monthly report', 'Goals set in real numbers before anything gets made'],
  ['Stock photos and templates', 'Your real team, filmed where the work happens'],
  ['A few posts a week, when someone has time', 'A steady stream of short and long-form video, every month'],
  ['Ideas only when you ask', "A team that's hungry for your next big problem"],
  ['Likes as the win', 'Calls, bookings and sales as the win'],
];

const switchSteps = [
  ['Own your stuff.', 'Make sure your ad accounts, social logins, domain, website hosting and raw footage are in your name, not theirs.'],
  ['Read your contract.', 'Know your notice period before you have the conversation.'],
  ['Decide what winning looks like.', 'Real numbers, agreed before the new team makes a single thing.'],
  ['Overlap if you can.', 'A short handoff beats a gap where nothing gets posted.'],
];

const ext = (href: string, children: ReactNode) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="link-line font-semibold">
    {children}
  </a>
);

const chapters = [
  ['01', 'The signs'],
  ['02', 'Why businesses stay'],
  ['03', 'The employee you handed social to'],
  ['04', 'What better looks like'],
  ['05', 'How to switch'],
  ['06', 'How long it takes'],
  ['07', 'If we’re not the fit'],
];

function H2({ index, children }: { index: string; children: ReactNode }) {
  return (
    <h2 className="display display-sm mb-6">
      <span className="eyebrow block mb-4 opacity-70">{index}</span>
      {children}
    </h2>
  );
}

function Chapter({ index, children }: { index?: string; children: ReactNode }) {
  return (
    <section id={index && `ch-${index}`} className="scroll-mt-28 border-t-2 rule pt-16 mt-16 space-y-6">
      {children}
    </section>
  );
}

export default function DontLetYourAgencyHoldYouBack() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <PageHero
        eyebrow="Blog"
        title={"Don't let your\nagency hold\nyou back."}
        outlineFrom={2}
        size="lg"
        subtitle="You already did the hard part. You built a business people love once they find it. So if growth has stalled, it's worth asking the honest question."
      />

      <Section tone="ink" flush>
        <article className="grid lg:grid-cols-12 gap-x-16 pt-[var(--section-pad)]">
          <div className="lg:col-span-7 text-lg leading-relaxed pb-56">
            <div className="space-y-6">
              <p className="lede">
                Is your marketing agency holding you back? Or is it the employee you handed social media to three years ago?
              </p>
              <p>
                We can&apos;t make you good at what you do. You already did that. Our job is to show it to the people who
                need to see it. And when your marketing isn&apos;t doing that, it doesn&apos;t matter how long the
                relationship has lasted.
              </p>
            </div>

            <nav aria-label="In this article" className="mt-12">
              <p className="eyebrow mb-4 opacity-70">In this article</p>
              <ol className="border-t-2 rule">
                {chapters.map(([n, label]) => (
                  <li key={n} className="border-b rule">
                    <a href={`#ch-${n}`} className="group flex items-baseline gap-4 py-3 font-semibold">
                      <span className="eyebrow opacity-60">{n}</span>
                      <span className="link-line">{label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <Chapter index="01">
              <H2 index="01">How do you know your marketing agency is holding you back?</H2>
              <p>{faqs[0].a}</p>
              <p>A few more signs to watch for:</p>
              <ul className="border-t-2 rule">
                {signs.map(([title, body]) => (
                  <li key={title} className="border-b-2 rule py-4">
                    <strong>{title}</strong> {body}
                  </li>
                ))}
              </ul>

              <p>Here&apos;s the side-by-side:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-base">
                  <thead>
                    <tr className="border-b-2 rule">
                      <th className="eyebrow py-3 pr-4">What you&apos;ve got now</th>
                      <th className="eyebrow py-3">What better marketing looks like</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map(([now, better]) => (
                      <tr key={now} className="border-b rule align-top">
                        <td className="py-3 pr-4 text-[color:var(--tone-muted)]">{now}</td>
                        <td className="py-3 font-semibold">{better}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Chapter>

            <Chapter index="02">
              <H2 index="02">Why do businesses stay with an agency that isn&apos;t working?</H2>
              <p>{faqs[1].a}</p>
              <p>
                But comfortable isn&apos;t the same as good. Loyalty is a great quality in a person. In a vendor, it can
                quietly cost you the goals you set for your company.
              </p>
            </Chapter>

            <Chapter index="03">
              <H2 index="03">What about the employee you handed social media to?</H2>
              <p>{faqs[2].a}</p>
              <p>
                That&apos;s not their fault. Creative that makes your customers say WOW takes strategy, shooting, editing and
                posting on a schedule, every single week. That&apos;s a job, not a side task.
              </p>
            </Chapter>

            <Chapter index="04">
              <H2 index="04">What does better marketing actually look like in 2026?</H2>
              <p>
                Better marketing in 2026 means video, made consistently, starring your real people.{' '}
                {ext('https://wyzowl.com/video-marketing-statistics/', '91% of businesses now use video as a marketing tool')},
                and{' '}
                {ext(
                  'https://wyzowl.com/video-marketing-statistics/',
                  "85% of people say they've been convinced to buy something by watching a video",
                )}
                .
              </p>
              <ul className="grid grid-cols-2 gap-6 border-y-2 rule py-6">
                {[
                  ['91%', 'of businesses use video in marketing'],
                  ['85%', 'of people were convinced to buy by a video'],
                ].map(([value, label]) => (
                  <li key={value}>
                    <span className="display display-md block">{value}</span>
                    <span className="block text-sm text-[color:var(--tone-muted)]">{label}</span>
                  </li>
                ))}
              </ul>
              <p>
                Short-form is where most of that happens. HubSpot&apos;s 2025 State of Marketing data found that{' '}
                {ext(
                  'https://blog.hubspot.com/marketing/video-marketing-statistics',
                  '21% of marketers say short-form video delivers the highest ROI',
                )}{' '}
                of any video format, and Wyzowl found{' '}
                {ext(
                  'https://wyzowl.com/video-marketing-statistics/',
                  '63% of people would rather learn about a product by watching a short video',
                )}{' '}
                than any other way.
              </p>
              <p>
                That&apos;s why we build around it. For{' '}
                <Link href="/work" className="link-line font-semibold">
                  Discount Drain Cleaning
                </Link>
                , that meant a content strategy, weekly on-location shoots, 30 reels a month, editing and community
                management, all from one team. Their plumbers became the personalities, and that&apos;s what people tuned in
                for.
              </p>
            </Chapter>

            <Chapter>
              <p className="eyebrow opacity-70">Case study — Discount Drain Cleaning</p>
              <p>
                Before us, they had a good business and a great crew, but a quiet social presence that wasn&apos;t keeping
                up with their growth. The problem wasn&apos;t the business. It was that almost nobody outside their
                customer base knew how good it was. After we started, views went from under 30K to over 2 million, likes
                went from 2K to 200K, and their TikTok went from 0 to 3,500 followers. Ad spend: $0. All organic.
              </p>
              <ul className="grid grid-cols-2 gap-6 border-y-2 rule py-6">
                {[
                  ['2M+', 'Views', 'from under 30K'],
                  ['200K', 'Likes', 'from 2K'],
                  ['3.5K', 'TikTok followers', 'from 0'],
                  ['$0', 'Ad spend', 'all organic'],
                ].map(([value, label, from]) => (
                  <li key={label}>
                    <span className="display display-md block">{value}</span>
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block text-sm text-[color:var(--tone-muted)]">{from}</span>
                  </li>
                ))}
              </ul>
              <p>
                <Link href="/work/1" className="link-line font-semibold">
                  See the full Discount Drain story <Arrow />
                </Link>
              </p>
            </Chapter>

            <Chapter index="05">
              <H2 index="05">How do you switch marketing agencies without losing momentum?</H2>
              <p>{faqs[3].a}</p>
              <ol className="border-t-2 rule">
                {switchSteps.map(([title, body], i) => (
                  <li key={title} className="border-b-2 rule py-4 flex gap-5">
                    <span className="display display-sm opacity-60 w-10 shrink-0">{i + 1}</span>
                    <span>
                      <strong>{title}</strong> {body}
                    </span>
                  </li>
                ))}
              </ol>
            </Chapter>

            <Chapter index="06">
              <H2 index="06">How long until you see results from a new agency?</H2>
              <p>{faqs[4].a}</p>
              <p>
                If you need results in two weeks, a new agency isn&apos;t the fix, and we&apos;ll tell you that up front.
              </p>
            </Chapter>

            <Chapter index="07">
              <H2 index="07">What if TAAM isn&apos;t the right fit for you?</H2>
              <p>
                Then we&apos;ll say so, and we&apos;ll refer you to someone who is. We&apos;d rather send you somewhere
                better than keep you somewhere comfortable.
              </p>
              <p>
                Not open yet? Start with our{' '}
                <Link href="/tools" className="link-line font-semibold">
                  free tools
                </Link>
                . Already open and selling? You may qualify for a{' '}
                <Link href="/free-video-offer" className="link-line font-semibold">
                  free week of video
                </Link>
                .
              </p>

              <h2 className="display display-sm pt-10">Ready to see what better marketing looks like?</h2>
              <p>
                Don&apos;t let a ten-year relationship with your agency, or the employee you handed social media to, stop
                your company from passing the goals you set. Give us a call. We&apos;ll give you better marketing, or
                we&apos;ll refer you to someone who can.
              </p>
              <div className="pt-4">
                <ContactCTA className="btn btn-solid">
                  Let&apos;s talk <Arrow />
                </ContactCTA>
              </div>

              <p className="border-t-2 rule pt-8 mt-16 text-base text-[color:var(--tone-muted)]">
                <strong className="text-white">About TAAM.</strong> TAAM is a content marketing team in Las Vegas doing
                strategy, video, social and web for businesses that are already great at what they do. Proven team, always
                hungry. Better marketing for the best businesses.
              </p>
            </Chapter>
          </div>

          <Tower />
        </article>
        <Street />
      </Section>
    </>
  );
}
