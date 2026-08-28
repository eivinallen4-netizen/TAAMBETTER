import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-auth';
import { DashboardStats } from './components/DashboardStats';

export default async function AdminDashboard() {
  await requireAdmin();

  return (
    <div>
      <h1 className="text-4xl font-black mb-8">Dashboard</h1>

      <DashboardStats />

      <div className="mt-12 p-6 bg-gray-900 border border-gray-700 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Quick Links</h2>
        <ul className="space-y-2">
          <li>
            <Link href="/admin/leads" className="text-[#F46325] hover:underline">
              View and manage leads
            </Link>
          </li>
          <li>
            <Link href="/admin/contacts" className="text-[#F46325] hover:underline">
              View and manage contacts
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
