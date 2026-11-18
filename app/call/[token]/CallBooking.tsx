'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import Mascot from '@/components/editorial/Mascot';
import { BOOKING_PATH } from '@/lib/brand-email';

// The "pick a time" block on a setter's private /call/[token] page. Booking happens on the CRM's
// schedule (the Marketing Strategy booking page); this page only counts the visit on the CRM's
// appointment link and shows the call time once the link is marked booked.

interface Props {
  token: string;
  initial: { callStart: string | null } | null;
  /** Replaces the default "Video call / Pick a time." heading. */
  heading?: ReactNode;
}

function formatCall(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
}

export default function CallBooking({ token, initial, heading }: Props) {
  // Count the open from the browser, so link previews in texts and DMs don't.
  useEffect(() => {
    fetch('/api/crm/public/public_get_appointment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).catch(() => {});
  }, [token]);

  if (initial) {
    const when = formatCall(initial.callStart);
    return (
      <div className="grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="eyebrow mb-6">See you there</p>
          <h2 className="display display-lg">
            You&apos;re <span className="outline-type">booked.</span>
          </h2>
          {when && <p className="mt-8 text-2xl font-extrabold uppercase tracking-tight md:text-3xl">{when}</p>}
          <p className="lede mt-6 max-w-xl">The video call link is in your email. Need a different time? Use the link in that same email.</p>
        </div>
        <div className="flex justify-center md:justify-end">
          <Mascot pose="wave" size={320} className="h-auto w-56 md:w-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
      <div>
        {heading ?? (
          <>
            <p className="eyebrow mb-6">Video call · 30 minutes</p>
            <h2 className="display display-lg mb-10">
              Pick a <span className="outline-type">time.</span>
            </h2>
          </>
        )}
        <Link href={BOOKING_PATH} className="btn btn-solid">
          Open the schedule →
        </Link>
      </div>
      <div className="flex justify-center md:justify-end">
        <Mascot pose="phone" size={320} className="h-auto w-56 md:w-72" />
      </div>
    </div>
  );
}
