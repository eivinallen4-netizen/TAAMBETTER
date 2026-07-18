import Link from 'next/link';
import siteContent from '../content/siteContent.json';

export default function Footer() {
  const content = siteContent;

  return (
    <footer className="bg-black border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-1">
          <img
            src="/brand-assets/logos/transparent/TAAM_logo_white_transparent.png"
            alt="TAAM"
            className="h-8 w-auto mb-4"
          />
          <p className="text-sm text-gray-400 leading-relaxed">{content.company.description}</p>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#F46325] mb-4">Site</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link href="/" className="hover:text-white transition">Home</Link></li>
            <li><Link href="/about" className="hover:text-white transition">About</Link></li>
            <li><Link href="/work" className="hover:text-white transition">Work</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#F46325] mb-4">Services</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            {content.company.services.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-[#F46325] mb-4">Contact</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <a href={`mailto:${content.contact.email}`} className="hover:text-white transition">
                {content.contact.email}
              </a>
            </li>
            <li>
              <a href={`tel:${content.contact.phone.replace(/[^+\d]/g, '')}`} className="hover:text-white transition">
                {content.contact.phone}
              </a>
            </li>
            <li>{content.contact.address}</li>
          </ul>
          <div className="flex gap-4 mt-4">
            <a href={content.contact.social.instagram} className="text-sm text-gray-400 hover:text-[#F46325] transition">Instagram</a>
            <a href={content.contact.social.twitter} className="text-sm text-gray-400 hover:text-[#F46325] transition">Twitter</a>
            <a href={content.contact.social.linkedin} className="text-sm text-gray-400 hover:text-[#F46325] transition">LinkedIn</a>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} {content.company.name}. All rights reserved.</span>
          <span>{content.company.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
