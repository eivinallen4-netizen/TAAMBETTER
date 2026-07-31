'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import siteContent from '../content/siteContent.json';
import ContactCTA from './ContactCTA';
import SocialLink from './SocialLink';

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
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
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
          className={`transition-all duration-300 ${
            scrolled || isOpen
              ? 'bg-taam-near-black/95 backdrop-blur-sm border-b-2 border-[#F46325] shadow-lg shadow-orange-500/10'
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
                className="group inline-flex items-center gap-1.5 px-4 py-2 bg-[#111111] text-white text-sm font-bold uppercase tracking-wide hover:bg-black transition relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent group-hover:translate-x-full transition-transform duration-500 -translate-x-full" />
                <span className="relative">See Our Work</span>
                <ArrowUpRight className="w-4 h-4 relative transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>
            </div>

            <button
              className="md:hidden relative z-10 text-white hover:text-[#F46325] transition"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu - Outside nav to be truly full screen */}
      <div
        className={`md:hidden fixed inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ zIndex: 100 }}
      >
        <div className="flex flex-col h-screen justify-between pt-24 pb-10 px-8">
          {/* Close Button */}
          <button
            className="absolute top-6 right-6 text-white hover:text-[#F46325] transition"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            style={{ zIndex: 101 }}
          >
            <X className="w-8 h-8" />
          </button>

          {/* Main Navigation Links */}
          <div className="space-y-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block text-4xl font-black uppercase tracking-wide transition ${
                  pathname === link.href ? 'text-[#F46325]' : 'text-white hover:text-[#F46325]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <ContactCTA
              onOpen={() => setIsOpen(false)}
              className="block text-4xl font-black uppercase tracking-wide transition text-white hover:text-[#F46325]"
            >
              Contact
            </ContactCTA>
          </div>

          {/* Footer Section: Contact Info & Social */}
          <div className="space-y-6">
            {/* Contact Details */}
            <div className="border-t border-gray-700 pt-6">
              <a
                href={`mailto:${content.contact.email}`}
                className="text-sm text-gray-400 hover:text-[#F46325] transition block mb-2"
              >
                {content.contact.email}
              </a>
              <a
                href={`tel:${content.contact.phone.replace(/[^+\d]/g, '')}`}
                className="text-sm text-gray-400 hover:text-[#F46325] transition block mb-2"
              >
                {content.contact.phone}
              </a>
              <p className="text-sm text-gray-500">{content.contact.address}</p>
            </div>

            {/* Social Icons */}
            <div className="flex gap-5">
              <SocialLink
                url={content.contact.social.instagram}
                className="hover:scale-110 transition"
                style={{ height: 36, width: 36 }}
                bgColor="transparent"
                fgColor="#9CA3AF"
              />
              <SocialLink
                url={content.contact.social.twitter}
                className="hover:scale-110 transition"
                style={{ height: 36, width: 36 }}
                bgColor="transparent"
                fgColor="#9CA3AF"
              />
              <SocialLink
                url={content.contact.social.linkedin}
                className="hover:scale-110 transition"
                style={{ height: 36, width: 36 }}
                bgColor="transparent"
                fgColor="#9CA3AF"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
