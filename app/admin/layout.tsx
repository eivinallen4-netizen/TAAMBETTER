'use client';

import Link from 'next/link';
import { LogoutButton } from './components/LogoutButton';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-1 min-h-screen bg-taam-near-black text-white flex-col">
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 border-r border-gray-700 min-h-screen">
          <div className="p-6">
            <h1 className="text-2xl font-black mb-8 text-[#F46325]">Admin</h1>

            <nav className="space-y-2">
              <Link
                href="/admin"
                className="block px-4 py-2 rounded hover:bg-gray-800 transition text-gray-300 hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/leads"
                className="block px-4 py-2 rounded hover:bg-gray-800 transition text-gray-300 hover:text-white"
              >
                Leads
              </Link>
              <Link
                href="/admin/contacts"
                className="block px-4 py-2 rounded hover:bg-gray-800 transition text-gray-300 hover:text-white"
              >
                Contacts
              </Link>
            </nav>
          </div>

          <div className="absolute bottom-6 left-6 w-52">
            <LogoutButton />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
