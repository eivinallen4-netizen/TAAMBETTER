import { crm } from '@/crm';

// Customer-facing CRM pages: onboarding, quotes, invoices, documents to sign, booking pages.
// Appointment links (/c/book/<token>) open the same scheduler as the booking pages (/c/meet/<slug>).
export const dynamic = 'force-dynamic';

export default async function PublicCrmPage({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  return <crm.PublicPage params={Promise.resolve({ path })} />;
}
