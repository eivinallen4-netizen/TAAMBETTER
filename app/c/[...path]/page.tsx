import { redirect } from 'next/navigation';
import { crm } from '@/crm';

// Customer-facing CRM pages: onboarding, quotes, invoices, documents to sign.
export const dynamic = 'force-dynamic';

export default async function PublicCrmPage({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  // Booking links the CRM hands out (/c/book/<token>) open TAAM's own booking page.
  if (path[0] === 'book' && path[1] && path.length === 2) redirect(`/call/${encodeURIComponent(path[1])}`);
  return <crm.PublicPage params={Promise.resolve({ path })} />;
}
