import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Logo from '@/components/editorial/Logo';
import Mascot from '@/components/editorial/Mascot';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { getAppointmentLinkByToken } from '@/lib/appointments';
import { calendlyEventUrl } from '@/lib/calendly';
import { PHONE } from '@/lib/brand-email';
import CallBooking from './CallBooking';

// The page an appointment setter sends a prospect. Made for their business, and the only thing on
// it to do is pick a time for the video call where the closer shows them their custom landing page.

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your video call',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

const LOGO_RE = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

const ON_THE_CALL = [
  ['See your new page, live', 'The landing page we built for your business, on screen.'],
  ['How it brings in customers', 'What it does for you once it is out there working.'],
  ['Your questions, answered', 'Straight answers. No pressure.'],
] as const;

export default async function CallPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = getAdminDb();
  await initializeTables(db);
  const link = await getAppointmentLinkByToken(db, token);
  if (!link) notFound();

  let logo = '';
  if (link.contact_id) {
    const found = await db.execute({ sql: 'SELECT logo FROM contacts WHERE id = ?', args: [link.contact_id] });
    const value = String(found.rows[0]?.logo ?? '');
    if (LOGO_RE.test(value)) logo = value;
  }

  const business = link.business_name;
  const firstName = link.client_name.trim().split(/\s+/)[0] ?? '';

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="tone-orange relative overflow-clip">
        <div className="gutter flex items-center justify-between gap-4 pt-6">
          <Logo className="h-6 md:h-7" />
          <span className="eyebrow truncate opacity-90">Made for {business}</span>
        </div>
        <div className="gutter grid items-end gap-10 pb-16 pt-14 md:grid-cols-[1.4fr_1fr] md:pb-24 md:pt-24">
          <div className="min-w-0">
            <p className="eyebrow mb-6">A private page for {business}</p>
            <h1 className="display display-lg">
              <span className="block break-words">{business},</span>
              <span className="block">we built you</span>
              <span className="outline-type block">something.</span>
            </h1>
            <p className="lede mt-8 max-w-xl">
              {firstName ? `${firstName}, we` : 'We'} made a custom landing page for {business}. Pick a time and we&apos;ll walk you
              through it on a quick video call.
            </p>
            <a href="#book" className="btn btn-solid mt-10">
              Pick a time ↓
            </a>
          </div>
          <div className="relative flex justify-center md:justify-end">
            {logo ? (
              <div className="flex aspect-square w-56 items-center justify-center rounded-[var(--radius-card)] bg-white p-8 md:w-72">
                {/* eslint-disable-next-line @next/next/no-img-element -- stored as a small data: URL */}
                <img src={logo} alt={`${business} logo`} className="max-h-full max-w-full object-contain" />
              </div>
            ) : (
              <Mascot pose="phone" size={360} priority className="h-auto w-64 md:w-80" />
            )}
          </div>
        </div>
      </section>

      {/* What happens on the call */}
      <section className="tone-ink relative overflow-clip">
        <div className="gutter section-pad">
          <p className="eyebrow mb-6 opacity-80">On the call</p>
          <h2 className="display display-md mb-12 max-w-3xl">
            One call. <span className="outline-type">Your new page.</span>
          </h2>
          <ol className="grid gap-8 md:grid-cols-3">
            {ON_THE_CALL.map(([title, line], i) => (
              <li key={title} className="rule border-t pt-6">
                <span className="eyebrow text-taam-orange">0{i + 1}</span>
                <p className="mt-3 text-xl font-extrabold uppercase tracking-tight">{title}</p>
                <p className="mt-2 text-white/70">{line}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Book */}
      <section id="book" className="tone-orange relative scroll-mt-4 overflow-clip">
        <div className="gutter section-pad">
          <CallBooking
            token={token}
            eventUrl={calendlyEventUrl()}
            name={link.client_name}
            phone={PHONE}
            initial={link.status === 'booked' ? { callStart: link.call_start } : null}
          />
        </div>
      </section>
    </div>
  );
}
