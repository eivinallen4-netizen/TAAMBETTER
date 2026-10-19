'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck, Eye, EyeOff } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { CopyButton } from './NewOnboardingModal';

// A contact's appointment links (made by setters on /admin/appointments), shown on their page.

interface Link {
  id: string;
  created_by_name: string;
  created_at: string;
  opened_at: string | null;
  open_count: number;
  call_start: string | null;
  status: string;
  social_url: string;
  gbp_url: string;
  url: string;
}

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '');

export function ContactAppointments({ contactId }: { contactId: string }) {
  const [links, setLinks] = useState<Link[]>([]);

  useEffect(() => {
    fetch(`/api/admin/appointments?contactId=${encodeURIComponent(contactId)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setLinks(d.data ?? []))
      .catch(() => {});
  }, [contactId]);

  if (links.length === 0) return null;
  const first = links.find((l) => l.social_url || l.gbp_url);

  return (
    <section className="mb-6 rounded-xl border border-gray-800 bg-gray-900/60 p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-gray-400">
        <CalendarCheck className="h-4 w-4 text-[#F46325]" /> Appointment links
      </h2>
      <ul className="divide-y divide-gray-800">
        {links.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 py-3 text-sm first:pt-0 last:pb-0">
            <StatusBadge status={l.status} />
            <span className="text-gray-300">
              Made {when(l.created_at)} by {l.created_by_name}
            </span>
            {l.opened_at ? (
              <span className="flex items-center gap-1.5 text-sky-300">
                <Eye className="h-4 w-4" /> Opened {when(l.opened_at)}
                {l.open_count > 1 && <span className="text-gray-500">×{l.open_count}</span>}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-gray-500">
                <EyeOff className="h-4 w-4" /> Not opened
              </span>
            )}
            {l.status === 'booked' && <span className="font-semibold text-emerald-300">Call {l.call_start ? when(l.call_start) : 'booked'}</span>}
            <span className="ml-auto">
              <CopyButton text={l.url} />
            </span>
          </li>
        ))}
      </ul>
      {first && (
        <p className="mt-4 flex gap-4 text-xs">
          {first.social_url && (
            <a href={first.social_url} target="_blank" rel="noreferrer" className="text-gray-400 underline hover:text-white">
              Social profile
            </a>
          )}
          {first.gbp_url && (
            <a href={first.gbp_url} target="_blank" rel="noreferrer" className="text-gray-400 underline hover:text-white">
              Google Business Profile
            </a>
          )}
        </p>
      )}
    </section>
  );
}
