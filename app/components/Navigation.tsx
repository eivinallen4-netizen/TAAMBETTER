'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import siteContent from '../content/siteContent.json';
import ContactCTA from './ContactCTA';

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/work', label: 'Work' },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const content = siteContent;

  // Nav sits transparent over the orange hero until scrolled (or dark once the mobile
  // menu is open). Hover/focus needs to read against both: black over the orange hero
  // (that's the fix — orange-on-orange was invisible), white + a border cue once the
  // navbar itself goes dark (black-on-near-black would be just as unreadable).
  const navIsDark = scrolled || isOpen;
  const desktopLinkClass = navIsDark
    ? 'text-white border-transparent hover:border-white focus-visible:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
    : 'text-white border-transparent hover:text-black focus-visible:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {/* Utility bar: only once page has scrolled past the hero, so it doesn't fight the video mask */}
      <div
        className={`hidden md:block overflow-hidden bg-[#0a0a0a] border-b border-gray-800 transition-[max-height,opacity] duration-300 ${
          scrolled ? 'max-h-8 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className=" mx-auto px-4 py-1.5 flex items-center justify-end gap-6 text-xs text-gray-400">
          <a href={`mailto:${content.contact.email}`} className="hover:text-[#F46325] transition">
            {content.contact.email}
          </a>
          <a href={`tel:${content.contact.phone.replace(/[^+\d]/g, '')}`} className="hover:text-[#F46325] transition">
            {content.contact.phone}
          </a>
          <span className="text-gray-600">{content.contact.address}</span>
        </div>
      </div>

      <nav
        className={`transition-colors duration-300 ${
          scrolled || isOpen
            ? 'bg-taam-near-black/95 backdrop-blur-sm border-b-2 border-[#F46325]'
            : 'bg-transparent border-b-2 border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="relative z-10 shrink-0" onClick={() => setIsOpen(false)}>
            <Image
              src="/brand-assets/logos/transparent/TAAM_logo_white_transparent.png"
              alt="TAAM"
              width={710}
              height={297}
              priority
              className="h-8 md:h-10 w-auto"
            />
          </Link>

          <div className="hidden md:flex gap-8 items-center">
            {links
              .filter((link) => link.href !== '/')
              .map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`transition font-semibold uppercase text-sm tracking-wide pb-1 border-b-2 outline-none ${
                      active ? 'text-[#F46325] border-[#F46325]' : desktopLinkClass
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            <ContactCTA
              className={`transition font-semibold uppercase text-sm tracking-wide pb-1 border-b-2 outline-none ${desktopLinkClass}`}
            >
              Contact
            </ContactCTA>
            <Link
              href="/work"
              className="group inline-flex items-center gap-1.5 px-4 py-2 bg-[#111111] text-white text-sm font-bold uppercase tracking-wide hover:bg-black transition"
            >
              See Our Work
              <span className="transition-transform group-hover:translate-x-1">↗</span>
            </Link>
          </div>

          <button
            className="md:hidden relative z-10 text-white hover:text-[#F46325] transition"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        <div
          className={`md:hidden fixed inset-0 top-0 bg-taam-near-black transition-opacity duration-300 ${
            isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-10 h-full px-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`transition font-black uppercase text-4xl tracking-wide outline-none ${
                  pathname === link.href
                    ? 'text-[#F46325]'
                    : 'text-white hover:underline focus-visible:underline decoration-2 underline-offset-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <ContactCTA
              onOpen={() => setIsOpen(false)}
              className="text-white hover:underline focus-visible:underline decoration-2 underline-offset-4 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white transition font-semibold uppercase text-lg tracking-wide"
            >
              {content.contact.email}
            </ContactCTA>
          </div>
        </div>
      </nav>
    </div>
  );
}
