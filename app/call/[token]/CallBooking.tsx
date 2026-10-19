'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import Mascot from '@/components/editorial/Mascot';

// Calendly's inline widget, prefilled with their name and tagged with the link's token
// (utm_content) so the booking finds its way back to this link in the CRM.

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (o: { url: string; parentElement: HTMLElement; prefill?: Record<string, unknown>; utm?: Record<string, string> }) => void;
    };
  }
}

interface Props {
  token: string;
  eventUrl: string;
  name: string;
  phone: string;
  initial: { callStart: string | null } | null;
}

function formatCall(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
}

function post(token: string, body: Record<string, unknown>) {
  return fetch(`/api/call/${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export default function CallBooking({ token, eventUrl, name, phone, initial }: Props) {
  const [booked, setBooked] = useState<{ callStart: string | null } | null>(initial);
  const widget = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  // Count the open from the browser, so link previews in texts and DMs don't.
  useEffect(() => {
    post(token, { event: 'opened' }).catch(() => {});
  }, [token]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== 'https://calendly.com' || e.data?.event !== 'calendly.event_scheduled') return;
      const inviteeUri: string | undefined = e.data?.payload?.invitee?.uri;
      setBooked({ callStart: null });
      post(token, { event: 'scheduled', inviteeUri })
        .then((r) => r.json())
        .then((d) => d?.callStart && setBooked({ callStart: d.callStart }))
        .catch(() => {});
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [token]);

  function startWidget() {
    if (started.current || !window.Calendly || !widget.current || !eventUrl) return;
    started.current = true;
    const url = new URL(eventUrl);
    url.searchParams.set('hide_gdpr_banner', '1');
    url.searchParams.set('primary_color', 'f46325');
    window.Calendly.initInlineWidget({
      url: url.toString(),
      parentElement: widget.current,
      prefill: { name },
      utm: { utmSource: 'taam', utmMedium: 'appointment-link', utmContent: token },
    });
  }

  if (booked) {
    const when = formatCall(booked.callStart);
    return (
      <div className="grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="eyebrow mb-6">See you there</p>
          <h2 className="display display-lg">
            You&apos;re <span className="outline-type">booked.</span>
          </h2>
          {when && <p className="mt-8 text-2xl font-extrabold uppercase tracking-tight md:text-3xl">{when}</p>}
          <p className="lede mt-6 max-w-xl">The video call link is in your email. Need a different time? Use the reschedule link in that same email.</p>
        </div>
        <div className="flex justify-center md:justify-end">
          <Mascot pose="wave" size={320} className="h-auto w-56 md:w-72" />
        </div>
      </div>
    );
  }

  if (!eventUrl) {
    return (
      <div>
        <h2 className="display display-md">Let&apos;s find a time.</h2>
        <p className="lede mt-6">
          Call or text us at{' '}
          <a className="underline" href={`tel:${phone.replace(/\D/g, '')}`}>
            {phone}
          </a>{' '}
          and we&apos;ll set it up.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow mb-6">Video call</p>
      <h2 className="display display-lg mb-10">
        Pick a <span className="outline-type">time.</span>
      </h2>
      <div className="overflow-hidden rounded-[var(--radius-card)] bg-white">
        <div ref={widget} className="h-[1100px] w-full md:h-[760px]" />
      </div>
      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="afterInteractive" onReady={startWidget} />
    </div>
  );
}
