import type { Metadata } from 'next';
import Link from 'next/link';
import PageHero from '@/components/sections/PageHero';
import LegalSections, { type LegalSection } from '@/components/sections/LegalSections';
import { LEGAL } from '../lib/legal';
import siteContent from '../content/siteContent.json';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'What TAAM collects on taammarketing.com, how we use it, how our emails and text messages work, who we share it with and how to have it deleted.',
  alternates: { canonical: '/privacy' },
};

const { email, phone } = siteContent.contact;
const tel = `tel:${phone.replace(/[^+\d]/g, '')}`;

const Email = () => <a href={`mailto:${email}`} className="link-line font-semibold">{email}</a>;
const Phone = () => <a href={tel} className="link-line font-semibold">{phone}</a>;

const sections: LegalSection[] = [
  {
    id: 'who-we-are',
    title: 'Who we are',
    body: (
      <>
        <p>
          This policy covers {LEGAL.site} and the emails and text messages we send. &ldquo;TAAM&rdquo;,
          &ldquo;we&rdquo; and &ldquo;us&rdquo; mean {LEGAL.entity}, a {LEGAL.state} limited liability company based
          in Las Vegas. Questions go to <Email /> or <Phone />.
        </p>
        <p>
          Using the site also means you agree to our <Link href="/terms" className="link-line font-semibold">Terms of Service</Link>.
        </p>
      </>
    ),
  },
  {
    id: 'what-we-collect',
    title: 'What we collect',
    body: (
      <>
        <p>When you fill out a form on this site we collect what you type in. Depending on the form, that can be:</p>
        <ul>
          <li>Your name, business name, email, phone number and website or social handle.</li>
          <li>Your answers about the business: your role, industry, stage, sales, budget, timeline and what you need help with.</li>
          <li>Whether you agreed to get text messages from us, and when and where you agreed.</li>
          <li>The site you enter into one of our free tools, so we can run the check and send you the report.</li>
          <li>Job applications: the details, links and files you send us.</li>
          <li>For clients: onboarding answers, account access you choose to share with us, files, and signed agreements.</li>
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
    id: 'how-we-use-it',
    title: 'How we use it',
    body: (
      <ul>
        <li>To reply to you, call you, text you if you agreed to texts, and prepare for a call with you.</li>
        <li>To schedule calls and send reminders.</li>
        <li>To send the report or offer you asked for.</li>
        <li>To deliver our services to clients, send invoices and keep records.</li>
        <li>To review job applications.</li>
        <li>To understand which pages help people and improve the site.</li>
        <li>To keep the site secure, stop spam and meet our legal obligations.</li>
      </ul>
    ),
  },
  {
    id: 'email',
    title: 'Emails from us',
    body: (
      <>
        <p>
          When you contact us or use a free tool, we email you about that request: replies, reports, scheduling and
          follow-ups. Clients also get project and billing emails. These are part of the service you asked for.
        </p>
        <p>
          Filling out a form doesn&apos;t sign you up for a newsletter. If we ever send you a marketing email, it will
          say who it&apos;s from, include our mailing address, and have an unsubscribe link. Unsubscribing stops
          marketing emails within 10 business days. You can also reply &ldquo;unsubscribe&rdquo; or email <Email />.
          We may still send emails about an active request, project or invoice.
        </p>
      </>
    ),
  },
  {
    id: 'text-messages',
    title: 'Text messages (SMS)',
    body: (
      <>
        <p>
          We only text you if you gave us your number and checked the box agreeing to texts, or texted us first. The
          box is never pre-checked and you don&apos;t have to check it to send a form or buy from us.
        </p>
        <ul>
          <li>
            <strong>What we send:</strong> replies about your request, call scheduling and reminders, project updates
            for clients, and occasional offers from TAAM.
          </li>
          <li><strong>How often:</strong> message frequency varies with your request.</li>
          <li><strong>Cost:</strong> message and data rates may apply, depending on your mobile plan.</li>
          <li>
            <strong>Opting out:</strong> reply <strong>STOP</strong>{' '}to any text and we&apos;ll stop texting that number.
            We&apos;ll send one message confirming you&apos;ve opted out. Reply <strong>START</strong> to opt back in.
          </li>
          <li>
            <strong>Help:</strong> reply <strong>HELP</strong>, email <Email /> or call <Phone />.
          </li>
          <li>Carriers are not liable for delayed or undelivered messages.</li>
        </ul>
        <p>
          <strong>
            We do not sell, rent or share your mobile number or text-message opt-in with third parties or affiliates
            for their marketing or promotional purposes. Text-messaging opt-in data and consent are never shared with
            any third party.
          </strong>{' '}
          The only companies that handle your number are the service providers that send the messages for us, and
          they may use it only to do that.
        </p>
        <p>
          The full text-messaging terms are in our{' '}
          <Link href="/terms#text-messages" className="link-line font-semibold">Terms of Service</Link>.
        </p>
      </>
    ),
  },
  {
    id: 'what-we-dont-do',
    title: 'What we don’t do',
    body: (
      <p>
        We don&apos;t sell your personal information, we don&apos;t rent it out, and we don&apos;t share it for
        cross-context behavioral advertising. A real person on our team reads every submission.
      </p>
    ),
  },
  {
    id: 'sharing',
    title: 'Who we share it with',
    body: (
      <>
        <p>Only the services that run our business, and only for the jobs above. They aren&apos;t allowed to use it for anything else:</p>
        <ul>
          <li><strong>Vercel</strong> hosts the site and gives us anonymous page-view analytics.</li>
          <li><strong>Google Analytics</strong> measures how visitors use the site. It uses cookies.</li>
          <li><strong>Turso</strong>, our database provider, stores form submissions and client records.</li>
          <li><strong>Resend</strong> delivers the emails we send you, such as reports and replies.</li>
          <li><strong>Our text-messaging provider</strong> delivers texts to people who agreed to them.</li>
          <li><strong>Calendly</strong> handles bookings if you schedule a call with us.</li>
          <li><strong>Payment and accounting tools</strong> process client invoices. We never see or store full card numbers.</li>
        </ul>
        <p>
          We may also share information if the law requires it, to protect our rights or someone&apos;s safety, or as
          part of a merger or sale of the business, in which case this policy still applies to it.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies',
    body: (
      <p>
        Google Analytics sets cookies to tell new visitors from returning ones. You can block or delete cookies in your
        browser settings, or install Google&apos;s opt-out add-on at tools.google.com/dlpage/gaoptout. The site works
        without them. We treat a Global Privacy Control signal from your browser as a request to opt out of any sale
        or sharing, though we don&apos;t do either.
      </p>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    body: (
      <p>
        We keep contact and lead details while we&apos;re talking with you or working together, and for a reasonable
        time after so we have a record of the conversation. We keep client contracts and invoices as long as tax and
        business law requires. We keep a record of text-message opt-ins and opt-outs so we can prove consent and
        honor your choice. Ask us and we&apos;ll delete anything we aren&apos;t required to keep.
      </p>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    body: (
      <p>
        We use encrypted connections, access controls and reputable providers to protect your information. No system
        is perfectly secure, so if we ever learn of a breach that affects you, we&apos;ll tell you as the law requires.
      </p>
    ),
  },
  {
    id: 'your-choices',
    title: 'Your choices and rights',
    body: (
      <>
        <p>
          You can ask to see the information we hold about you, correct it, delete it, or get a copy. Email <Email /> or
          call <Phone />{' '}and we&apos;ll take care of it within 45 days. We may need to confirm it&apos;s you first. We
          won&apos;t treat you differently for asking.
        </p>
        <p>
          <strong>Nevada residents:</strong>{' '}we don&apos;t sell covered information as defined in Nevada law (NRS
          603A). You can still send us an opt-out request at <Email />{' '}and we&apos;ll record it.
        </p>
        <p>
          Depending on where you live, such as California, you may have extra rights under your state&apos;s privacy
          laws. We honor those requests too, and you can use an authorized agent to make them.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children',
    body: <p>This site is for businesses. We don&apos;t knowingly collect information from anyone under 16, and we don&apos;t text anyone under 18.</p>,
  },
  {
    id: 'other-sites',
    title: 'Other sites',
    body: (
      <p>
        Our site links to other sites, like our social pages and client work. Their own privacy policies apply there,
        not this one.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes',
    body: (
      <p>
        If we change this policy we&apos;ll update it on this page and change the date at the top. If a change affects
        how we use information we already have, we&apos;ll ask before doing it.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    body: (
      <p>
        {LEGAL.entity}, Las Vegas, {LEGAL.state}. Email <Email /> or call <Phone />.
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
        subtitle={`What we collect, how our emails and texts work, and how to have your info deleted. Last updated ${LEGAL.updated}.`}
      />
      <LegalSections sections={sections} />
    </>
  );
}
