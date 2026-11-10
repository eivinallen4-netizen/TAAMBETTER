import type { Metadata } from 'next';
import PageHero from '@/components/sections/PageHero';
import Section from '@/components/editorial/Section';
import siteContent from '../content/siteContent.json';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'What TAAM collects when you use taammarketing.com, why we collect it, who we share it with and how to have it deleted.',
  alternates: { canonical: '/privacy' },
};

const UPDATED = 'November 9, 2026';
const { email, phone } = siteContent.contact;

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: 'What we collect',
    body: (
      <>
        <p>When you fill out a form on this site we collect what you type in. Depending on the form, that can be:</p>
        <ul>
          <li>Your name, business name, email, phone number and website or social handle.</li>
          <li>Your answers about the business: your role, industry, stage, budget, timeline and what you need help with.</li>
          <li>The site you enter into one of our free tools, so we can run the check and send you the report.</li>
          <li>Job applications: the details, links and files you send us.</li>
        </ul>
        <p>
          On the contact form, we keep your answers once you have entered a valid email, even if you don&apos;t finish,
          so a dropped connection doesn&apos;t lose your progress.
        </p>
        <p>
          We also collect basic usage data automatically: pages visited, the referring site, device and browser type,
          and an approximate location based on your IP address. We use your IP address to block spam and abuse.
        </p>
      </>
    ),
  },
  {
    title: 'How we use it',
    body: (
      <ul>
        <li>To reply to you, call you back and prepare for a call with you.</li>
        <li>To send the report or offer you asked for.</li>
        <li>To review job applications.</li>
        <li>To understand which pages help people and improve the site.</li>
        <li>To keep the site secure and stop spam.</li>
      </ul>
    ),
  },
  {
    title: 'What we don’t do',
    body: (
      <p>
        We don&apos;t sell your information, we don&apos;t rent it out, and we don&apos;t add you to a newsletter or
        marketing list because you filled out a form. A real person on our team reads every submission.
      </p>
    ),
  },
  {
    title: 'Who we share it with',
    body: (
      <>
        <p>Only the services that run this site for us, and only for the jobs above:</p>
        <ul>
          <li><strong>Vercel</strong> hosts the site and gives us anonymous page-view analytics.</li>
          <li><strong>Google Analytics</strong> measures how visitors use the site. It uses cookies.</li>
          <li><strong>Our database provider</strong> stores form submissions.</li>
          <li><strong>Resend</strong> delivers the emails we send you, such as reports and replies.</li>
          <li><strong>Calendly</strong> handles bookings if you schedule a call with us.</li>
        </ul>
        <p>We may also share information if the law requires it.</p>
      </>
    ),
  },
  {
    title: 'Cookies',
    body: (
      <p>
        Google Analytics sets cookies to tell new visitors from returning ones. You can block or delete cookies in your
        browser settings, or install Google&apos;s opt-out add-on at tools.google.com/dlpage/gaoptout. The site works
        without them.
      </p>
    ),
  },
  {
    title: 'How long we keep it',
    body: (
      <p>
        We keep contact and lead details while we&apos;re talking with you or working together, and for a reasonable
        time after so we have a record of the conversation. Ask us and we&apos;ll delete it sooner.
      </p>
    ),
  },
  {
    title: 'Your choices',
    body: (
      <p>
        You can ask to see the information we hold about you, correct it or delete it. Email{' '}
        <a href={`mailto:${email}`} className="link-line font-semibold">{email}</a> or call{' '}
        <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className="link-line font-semibold">{phone}</a> and we&apos;ll
        take care of it. Depending on where you live, you may have extra rights under your state&apos;s privacy laws;
        we honor those requests too.
      </p>
    ),
  },
  {
    title: 'Children',
    body: <p>This site is for businesses. We don&apos;t knowingly collect information from anyone under 16.</p>,
  },
  {
    title: 'Changes',
    body: (
      <p>
        If we change this policy we&apos;ll update it on this page and change the date at the top.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacy"
        title={'Privacy\npolicy.'}
        outlineFrom={1}
        subtitle={`What we collect, why, and how to have it deleted. Last updated ${UPDATED}.`}
      />

      <Section tone="ink" index="01" label="The details">
        <div className="max-w-3xl space-y-14">
          {sections.map((s, i) => (
            <div key={s.title} className="border-t-2 rule pt-8">
              <p className="eyebrow mb-3 text-[color:var(--tone-muted)]">{String(i + 1).padStart(2, '0')}</p>
              <h2 className="display display-sm mb-5">{s.title}</h2>
              <div className="space-y-4 text-lg leading-relaxed text-[color:var(--tone-muted)] [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_strong]:text-white">
                {s.body}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
