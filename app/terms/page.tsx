import type { Metadata } from 'next';
import Link from 'next/link';
import PageHero from '@/components/sections/PageHero';
import LegalSections, { type LegalSection } from '@/components/sections/LegalSections';
import { LEGAL } from '../lib/legal';
import siteContent from '../content/siteContent.json';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms for using taammarketing.com, our free tools, and TAAM’s email and text messages, including how to opt out of texts.',
  alternates: { canonical: '/terms' },
};

const { email, phone } = siteContent.contact;
const tel = `tel:${phone.replace(/[^+\d]/g, '')}`;

const Email = () => <a href={`mailto:${email}`} className="link-line font-semibold">{email}</a>;
const Phone = () => <a href={tel} className="link-line font-semibold">{phone}</a>;
const Privacy = ({ children = 'Privacy Policy' }: { children?: React.ReactNode }) => (
  <Link href="/privacy" className="link-line font-semibold">{children}</Link>
);

const sections: LegalSection[] = [
  {
    id: 'agreement',
    title: 'The agreement',
    body: (
      <>
        <p>
          These terms are an agreement between you and {LEGAL.entity} (&ldquo;TAAM&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;), a {LEGAL.state} limited liability company. They cover {LEGAL.site}, our free tools and
          offers, and the emails and text messages we send. By using the site or sending us a form, you agree to them
          and to our <Privacy />.
        </p>
        <p>If you use the site for a business, you confirm you can agree to these terms for it.</p>
      </>
    ),
  },
  {
    id: 'services',
    title: 'Our services',
    body: (
      <>
        <p>
          The site describes what we do. Paid work starts only once we both sign a written proposal or service
          agreement. That agreement sets the scope, price, schedule, guarantee and cancellation terms for your
          project, and it controls if it differs from anything on the site.
        </p>
        <p>
          Prices and packages on the site can change, but never on work you&apos;ve already signed for. Results like
          views, leads and sales depend on many things outside our control, so we don&apos;t promise a specific
          number unless your agreement says so.
        </p>
      </>
    ),
  },
  {
    id: 'free-tools',
    title: 'Free tools and offers',
    body: (
      <>
        <p>
          Our free tools and reports are for general information. They use automated checks and public data, can be
          wrong or incomplete, and aren&apos;t legal, financial or technical advice. Only run them on sites you own or
          have permission to check.
        </p>
        <p>
          Free offers are limited to businesses that qualify under the terms shown with the offer, one per business,
          while capacity lasts. We can decline or end an offer at any time. Offers have no cash value.
        </p>
      </>
    ),
  },
  {
    id: 'text-messages',
    title: 'Text messaging terms',
    body: (
      <>
        <p>
          <strong>Program:</strong> {LEGAL.smsProgram}, run by {LEGAL.entity}. When you check the text-message box on
          one of our forms, you agree to get text messages from us at the number you gave, including replies about
          your request, call scheduling and reminders, project updates for clients, and occasional offers. Messages
          may be sent with automated technology.
        </p>
        <ul>
          <li><strong>Consent is optional.</strong> You don&apos;t have to agree to texts to send a form or buy from us.</li>
          <li><strong>Message frequency varies</strong> with your request and project.</li>
          <li><strong>Msg &amp; data rates may apply.</strong> Check your mobile plan.</li>
          <li>
            <strong>To stop:</strong> reply <strong>STOP</strong>{' '}(or CANCEL, END, QUIT, UNSUBSCRIBE) to any message.
            We&apos;ll confirm with one final text and then stop. Reply <strong>START</strong> to opt back in.
          </li>
          <li>
            <strong>For help:</strong> reply <strong>HELP</strong>, email <Email /> or call <Phone />.
          </li>
          <li>Carriers are not liable for delayed or undelivered messages.</li>
          <li>You must be 18 or older and the account holder of the number, or have the account holder&apos;s permission.</li>
          <li>
            If you change or give up your number, reply STOP first or tell us, so texts don&apos;t reach the next owner.
          </li>
        </ul>
        <p>
          We never sell or share your mobile number or text opt-in with third parties for their marketing. See the{' '}
          <Privacy>text-message section of our Privacy Policy</Privacy> for how we handle your number.
        </p>
      </>
    ),
  },
  {
    id: 'email',
    title: 'Emails',
    body: (
      <p>
        By sending us a form or using a free tool, you agree we can email you about that request. Any marketing email
        from us has an unsubscribe link, and we honor it within 10 business days. Emails about an active request,
        project or invoice may still come through after you unsubscribe.
      </p>
    ),
  },
  {
    id: 'your-info',
    title: 'What you send us',
    body: (
      <>
        <p>
          Give us accurate information, including a phone number and email that are yours. You keep ownership of
          anything you send us, like files, logos or answers. You let us use it to respond to you, prepare for a call
          and, if you become a client, do the work.
        </p>
        <p>
          If you send us ideas or feedback about TAAM, we can use them without owing you anything.
        </p>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Using the site',
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>Send spam, fake submissions, or someone else&apos;s contact details without their permission.</li>
          <li>Try to break, overload or get around the security of the site, its forms or tools.</li>
          <li>Scrape or copy the site in bulk, or use bots against it.</li>
          <li>Use the site for anything illegal or to harm anyone.</li>
        </ul>
        <p>We can block access or delete submissions that break these rules.</p>
      </>
    ),
  },
  {
    id: 'ownership',
    title: 'Our content',
    body: (
      <p>
        The site, the TAAM name and logo, the mascot, our copy, designs and videos belong to TAAM or the clients who
        let us show them. You can view and share links to the site, but you can&apos;t copy, resell or reuse our
        content or branding without written permission. Client work shown on the site belongs to those clients or is
        shown with their permission. Ownership of work we make for you is set in your service agreement.
      </p>
    ),
  },
  {
    id: 'third-parties',
    title: 'Other sites and services',
    body: (
      <p>
        The site links to and uses other services, like Calendly for bookings and social media for our work. Their
        own terms apply when you use them, and we aren&apos;t responsible for them.
      </p>
    ),
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    body: (
      <p className="uppercase text-base tracking-wide">
        The site, free tools, reports and offers are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;,
        without warranties of any kind, express or implied, including merchantability, fitness for a particular
        purpose and non-infringement. We don&apos;t promise the site will always be available or error-free.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'Limits on liability',
    body: (
      <p className="uppercase text-base tracking-wide">
        To the fullest extent the law allows, TAAM won&apos;t be liable for indirect, incidental, special,
        consequential or punitive damages, or lost profits, revenue or data, arising from your use of the site, free
        tools or messages. Our total liability for any claim about the site, free tools or messages is limited to
        $100. Liability for paid services is set in your service agreement. Some places don&apos;t allow these
        limits, so they apply only as far as the law permits.
      </p>
    ),
  },
  {
    id: 'indemnity',
    title: 'Indemnity',
    body: (
      <p>
        If you break these terms or the law while using the site, or send us information you didn&apos;t have the
        right to send, you agree to cover TAAM&apos;s resulting costs, including reasonable legal fees.
      </p>
    ),
  },
  {
    id: 'law',
    title: 'Governing law',
    body: (
      <p>
        These terms are governed by {LEGAL.state} law. Any dispute about them will be handled in the state or federal
        courts in {LEGAL.county}, {LEGAL.state}, and you agree to those courts. Before going to court, contact us at{' '}
        <Email />{' '}and we&apos;ll try to sort it out together first.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes and the rest',
    body: (
      <>
        <p>
          We may update these terms. When we do, we&apos;ll post them here and change the date at the top. Using the
          site after that means you accept the new terms.
        </p>
        <p>
          If part of these terms can&apos;t be enforced, the rest still applies. If we don&apos;t enforce a part right
          away, we haven&apos;t given up the right to. These terms, our Privacy Policy and any signed service agreement
          are the whole agreement about the site.
        </p>
      </>
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

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Terms"
        title={'Terms of\nservice.'}
        outlineFrom={1}
        subtitle={`The rules for using our site, free tools, emails and texts. Last updated ${LEGAL.updated}.`}
      />
      <LegalSections sections={sections} />
    </>
  );
}
