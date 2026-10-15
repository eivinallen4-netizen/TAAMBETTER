import { requireAdmin } from '@/lib/admin-auth';
import { DashboardStats } from './components/DashboardStats';

export default async function AdminDashboard() {
  await requireAdmin();

  return <DashboardStats />;
}
