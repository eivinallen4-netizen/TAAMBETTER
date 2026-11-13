'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Presentation, Search } from 'lucide-react';
import { logoUrl } from '../components/ContactLogo';

// Every lead's personalized marketing-plan slides in one list. Each lead's slides open at
// /admin/contacts/[id]/deck; the lead itself is in the CRM at /admin/leads/[id].

interface DeckLead {
  id: string;
  name: string;
  business_name: string;
  edited: boolean;
  logo_v: string;
}

export default function ClientSlidesPage() {
  const [leads, setLeads] = useState<DeckLead[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    fetch('/api/admin/decks', { cache: 'no-store' })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!alive) return;
        if (!r.ok) setError(d.error || 'Could not load the leads. Reload the page to try again.');
        else setLeads(d.leads ?? []);
      })
      .catch(() => alive && setError('Could not reach the server. Check your connection and reload.'));
    return () => {
      alive = false;
    };
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!leads || !q) return leads ?? [];
    return leads.filter((l) => `${l.name} ${l.business_name}`.toLowerCase().includes(q));
  }, [leads, query]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="mr-auto">
          <h1 className="text-xl font-black text-white">Client slides</h1>
          <p className="mt-1 text-sm text-gray-400">A marketing-plan deck for each lead, made from what they told us.</p>
        </div>
        <label className="relative block w-full sm:w-64">
          <span className="sr-only">Search leads</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leads"
            className="w-full rounded-lg border border-gray-700 bg-gray-950 py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 focus:border-[#F46325] focus:outline-none"
          />
        </label>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </p>
      ) : leads === null ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-sm text-gray-400">
          {leads.length === 0 ? 'No leads yet. Slides appear here as soon as a lead comes in.' : 'No lead matches that search.'}
        </p>
      ) : (
        <ul className="divide-y divide-gray-800 overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
          {shown.map((lead) => (
            <li key={lead.id}>
              <Link href={`/admin/contacts/${lead.id}/deck`} className="flex items-center gap-4 px-4 py-3 transition hover:bg-gray-800/60">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                  {lead.logo_v ? (
                    // eslint-disable-next-line @next/next/no-img-element -- a small private image served by the API
                    <img src={logoUrl(lead.id, lead.logo_v)} alt="" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <Presentation className="h-5 w-5 text-gray-400" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold text-white">{lead.business_name || lead.name}</span>
                  {lead.business_name && lead.name !== lead.business_name && <span className="block truncate text-sm text-gray-400">{lead.name}</span>}
                </span>
                {lead.edited && <span className="rounded-full bg-[#F46325]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#FF9A66]">Edited</span>}
                <span className="text-sm font-semibold text-gray-300">Open slides</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
