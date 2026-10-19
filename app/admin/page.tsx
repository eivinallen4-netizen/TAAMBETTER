import { redirect } from 'next/navigation';
import { requireStaff, sessionRole } from '@/lib/admin-auth';
import { DashboardStats } from './components/DashboardStats';

export default async function AdminDashboard() {
  const session = await requireStaff().catch(() => null);
  if (!session) redirect('/admin/login');
  // Setters only work with appointment links.
  if (sessionRole(session) !== 'admin') redirect('/admin/appointments');

  return <DashboardStats />;
}
