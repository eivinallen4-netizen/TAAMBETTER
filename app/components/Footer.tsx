'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import siteContent from '../content/siteContent.json';
import ContactCTA from './ContactCTA';
import Logo from '@/components/editorial/Logo';
import Arrow from '@/components/editorial/Arrow';

const socials = [
  { label: 'Instagram', key: 'instagram' },
  { label: 'LinkedIn', key: 'linkedin' },
  { label: 'X / Twitter', key: 'twitter' },
] as const;

export default function Footer() {
  const pathname = usePathname();
  const content = siteContent;

  if (pathname.startsWith('/admin') || pathname.startsWith('/onboarding/')) {
    return null;
  }

  return (
    <footer className="tone-ink relative overflow-clip">
      <div className="gutter pt-24 md:pt-32">
        <div className="grid grid-cols-12 gap-y-14 gap-x-6">
          <div className="col-span-12 lg:col-span-6">
            <p className="eyebrow mb-6 text-[color:var(--tone-muted)]">Start here</p>
            <ContactCTA className="display display-md text-left link-line">Tell us the goal you set.</ContactCTA>
          </div>

          <div className="col-span-6 md:col-span-4 lg:col-span-2 lg:col-start-7">
            <p className="eyebrow mb-5 text-[color:var(--tone-muted)]">Site</p>
            <ul className="space-y-2 font-semibold">
              <li><Link href="/" className="link-line">Home</Link></li>
              <li><Link href="/work" className="link-line">Work</Link></li>
              <li><Link href="/about" className="link-line">About</Link></li>
              <li><Link href="/tools" className="link-line">Free tools</Link></li>
              <li><Link href="/free-video-offer" className="link-line">Free video</Link></li>
              <li><Link href="/blog/dont-let-your-agency-hold-you-back" className="link-line">Is your agency holding you back?</Link></li>
            </ul>
          </div>

          <div className="col-span-6 md:col-span-4 lg:col-span-2">
            <p className="eyebrow mb-5 text-[color:var(--tone-muted)]">Follow</p>
            <ul className="space-y-2 font-semibold">
              {socials.map((s) => (
                <li key={s.key}>
                  <a href={content.contact.social[s.key]} target="_blank" rel="noopener noreferrer" className="link-line">
                    {s.label} <Arrow />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-12 md:col-span-4 lg:col-span-2">
            <p className="eyebrow mb-5 text-[color:var(--tone-muted)]">Contact</p>
            <ul className="space-y-2 font-semibold">
              <li><a href={`mailto:${content.contact.email}`} className="link-line break-all">{content.contact.email}</a></li>
              <li><a href={`tel:${content.contact.phone.replace(/[^+\d]/g, '')}`} className="link-line">{content.contact.phone}</a></li>
              <li>{content.contact.address}</li>
            </ul>
          </div>
        </div>

        <div className="mt-24 flex flex-col sm:flex-row justify-between gap-2 border-t rule pt-6 text-sm text-[color:var(--tone-muted)]">
          <span>© {new Date().getFullYear()} {content.company.name}. All rights reserved.</span>
          <span className="uppercase tracking-[0.2em] text-xs font-bold">Better marketing for the best businesses</span>
        </div>
      </div>

      {/* Edge-cropped wordmark: the footer ends on the logo, cut by the bottom of the page */}
      <div aria-hidden="true" className="gutter mt-10 -mb-[4.5vw] text-taam-orange">
        <Logo variant="wordmark" className="w-full" title="" />
      </div>
    </footer>
  );
}
