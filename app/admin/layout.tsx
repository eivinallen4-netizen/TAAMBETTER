'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ExternalLink, Globe, Inbox, LayoutDashboard, Menu, Share2, Video, X, type LucideIcon } from 'lucide-react';
import { LogoutButton } from './components/LogoutButton';

const NAV: { heading?: string; links: { href: string; label: string; icon: LucideIcon }[] }[] = [
  { links: [{ href: '/admin', label: 'Pipeline', icon: LayoutDashboard }] },
  {
    heading: 'Client onboarding',
    links: [
      { href: '/admin/website', label: 'Website', icon: Globe },
      { href: '/admin/social', label: 'Social media', icon: Share2 },
    ],
  },
  {
    heading: 'Leads',
    links: [
      { href: '/admin/leads', label: 'Free video offers', icon: Video },
      { href: '/admin/contacts', label: 'Contact & tools', icon: Inbox },
    ],
  },
];

function Logo() {
  return (
    <Link href="/admin" className="block">
      <span className="text-2xl font-black tracking-tight text-[#F46325]">TAAM</span>
      <span className="ml-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-500">CRM</span>
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Remember which page the mobile drawer was opened on, so navigating closes it.
  const [menuOpenOn, setMenuOpenOn] = useState<string | null>(null);
  const menuOpen = menuOpenOn === pathname;
  const setMenuOpen = (open: boolean) => setMenuOpenOn(open ? pathname : null);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const isActive = (href: string) => (href === '/admin' ? pathname === href : pathname.startsWith(href));

  const sidebar = (
    <>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3">
        {NAV.map((group, i) => (
          <div key={group.heading ?? i}>
            {group.heading && <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">{group.heading}</p>}
            <ul className="space-y-1">
              {group.links.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        active ? 'bg-[#F46325]/15 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${active ? 'text-[#F46325]' : ''}`} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-gray-800 p-4">
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-1 text-sm text-gray-500 hover:text-white">
          <ExternalLink className="h-4 w-4" /> View site
        </a>
        <LogoutButton />
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-taam-near-black text-white lg:flex-row">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-800 bg-gray-950 px-4 py-3 lg:hidden">
        <Logo />
        <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-gray-300 hover:bg-gray-800 hover:text-white">
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-gray-800 bg-gray-950">
            <div className="flex items-center justify-between px-6 pb-6 pt-5">
              <Logo />
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-gray-800 bg-gray-950 lg:flex">
        <div className="px-6 pb-6 pt-7">
          <Logo />
        </div>
        {sidebar}
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
