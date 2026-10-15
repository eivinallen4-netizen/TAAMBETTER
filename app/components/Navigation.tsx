'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import siteContent from '../content/siteContent.json';
import ContactCTA from './ContactCTA';
import Logo from '@/components/editorial/Logo';

const links: { href: string; label: string; short?: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/work', label: 'Work' },
  { href: '/about', label: 'About' },
  { href: '/tools', label: 'Free tools', short: 'Tools' },
];

const socials = [
  { label: 'Instagram', key: 'instagram' },
  { label: 'LinkedIn', key: 'linkedin' },
  { label: 'X / Twitter', key: 'twitter' },
] as const;

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const lastY = useRef(0);
  const content = siteContent;

  // Minimal header: transparent at the top, tucks away on scroll down, returns with a solid field on scroll up.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setSolid(y > 80);
      setHidden(y > 240 && y > lastY.current);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  if (pathname.startsWith('/admin') || pathname.startsWith('/onboarding/')) {
    return null;
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          hidden && !isOpen ? '-translate-y-full' : 'translate-y-0'
        } ${solid && !isOpen ? 'bg-taam-near-black/90 backdrop-blur-md' : 'bg-transparent'}`}
      >
        <div className="gutter flex h-20 items-center justify-between text-white">
          <Link href="/" aria-label="TAAM home" className="relative z-[70] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <Logo className="h-5 md:h-6" />
          </Link>

          <nav aria-label="Primary" className="hidden md:flex items-center gap-10">
            {links.slice(1).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname.startsWith(link.href) ? 'page' : undefined}
                className={`eyebrow link-line ${pathname.startsWith(link.href) ? '!bg-[length:100%_2px]' : ''}`}
              >
                {link.label}
              </Link>
            ))}
            <ContactCTA className="btn btn-ghost !py-3 !px-5">Let&apos;s talk</ContactCTA>
          </nav>

          <button
            type="button"
            className="md:hidden relative z-[70] eyebrow py-2"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-controls="site-menu"
          >
            {isOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </header>

      {/* Full-screen menu: an orange poster of oversized links */}
      <div
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className={`tone-orange fixed inset-0 z-[60] flex flex-col justify-between gutter pt-28 pb-10 transition-[clip-path] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden ${
          isOpen ? '[clip-path:inset(0_0_0_0)]' : '[clip-path:inset(0_0_100%_0)] pointer-events-none'
        }`}
      >
        <nav aria-label="Mobile">
          <ul className="space-y-2">
            {links.map((link, i) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  tabIndex={isOpen ? 0 : -1}
                  className={`display text-[19vw] block ${pathname === link.href ? '' : 'outline-type'}`}
                >
                  <span className="eyebrow align-top mr-3 [-webkit-text-stroke:0] text-white">0{i + 1}</span>
                  {link.short ?? link.label}
                </Link>
              </li>
            ))}
            <li>
              <ContactCTA
                onOpen={() => setIsOpen(false)}
                className="display text-[19vw] block text-left outline-type"
              >
                <span className="eyebrow align-top mr-3 [-webkit-text-stroke:0] text-white">0{links.length + 1}</span>
                Talk
              </ContactCTA>
            </li>
          </ul>
        </nav>

        <div className="space-y-6 border-t-2 border-white/40 pt-6">
          <div className="space-y-1 lede">
            <a href={`mailto:${content.contact.email}`} className="block">{content.contact.email}</a>
            <a href={`tel:${content.contact.phone.replace(/[^+\d]/g, '')}`} className="block">{content.contact.phone}</a>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {socials.map((s) => (
              <a key={s.key} href={content.contact.social[s.key]} target="_blank" rel="noopener noreferrer" className="eyebrow">
                {s.label} ↗
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
