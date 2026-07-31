import Link from 'next/link';
import siteContent from '../content/siteContent.json';
import SocialLink from './SocialLink';

export default function Footer() {
  const content = siteContent;

  return (
    <footer className="relative bg-black border-t border-gray-800/50 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_24%,rgba(244,99,37,.02)_25%,rgba(244,99,37,.02)_26%,transparent_27%,transparent_74%,rgba(244,99,37,.02)_75%,rgba(244,99,37,.02)_76%,transparent_77%,transparent)] bg-[length:80px_80px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-1">
          <img
            src="/brand-assets/logos/transparent/TAAM_logo_white_transparent.png"
            alt="TAAM"
            className="h-8 w-auto mb-4 hover:drop-shadow-[0_0_15px_rgba(244,99,37,0.3)] transition"
          />
          <p className="text-sm text-gray-400 leading-relaxed">{content.company.description}</p>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#F46325] mb-4">Site</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <Link href="/" className="hover:text-white hover:translate-x-1 transition duration-300 inline-block">
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white hover:translate-x-1 transition duration-300 inline-block">
                About
              </Link>
            </li>
            <li>
              <Link href="/work" className="hover:text-white hover:translate-x-1 transition duration-300 inline-block">
                Work
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#F46325] mb-4">Services</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            {content.company.services.map((service) => (
              <li key={service} className="hover:text-white hover:translate-x-1 transition duration-300">
                {service}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#F46325] mb-4">Contact</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <a href={`mailto:${content.contact.email}`} className="hover:text-white hover:text-[#F46325] transition">
                {content.contact.email}
              </a>
            </li>
            <li>
              <a
                href={`tel:${content.contact.phone.replace(/[^+\d]/g, '')}`}
                className="hover:text-white hover:text-[#F46325] transition"
              >
                {content.contact.phone}
              </a>
            </li>
            <li>{content.contact.address}</li>
          </ul>
          <div className="flex gap-4 mt-4">
            <SocialLink
              url={content.contact.social.instagram}
              className="hover:scale-110 transition"
              style={{ height: 40, width: 40 }}
              bgColor="transparent"
              fgColor="#9CA3AF"
            />
            <SocialLink
              url={content.contact.social.twitter}
              className="hover:scale-110 transition"
              style={{ height: 40, width: 40 }}
              bgColor="transparent"
              fgColor="#9CA3AF"
            />
            <SocialLink
              url={content.contact.social.linkedin}
              className="hover:scale-110 transition"
              style={{ height: 40, width: 40 }}
              bgColor="transparent"
              fgColor="#9CA3AF"
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 hover:text-gray-400 transition">
          <span>© {new Date().getFullYear()} {content.company.name}. All rights reserved.</span>
          <span className="text-gray-600">{content.company.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
