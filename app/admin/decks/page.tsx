'use client';

import { useEffect, useMemo, useState } from 'react';
import { Presentation } from 'lucide-react';
import { Badge, Empty, Notice, PageHeader, Table } from '@taam/crm/client';
import { logoUrl } from '../components/ContactLogo';
import { SearchInput } from '../components/crm-ui';

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
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Client slides" subtitle="A marketing-plan deck for each lead, made from what they told us." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput label="Search leads" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full sm:w-auto sm:min-w-56 sm:flex-1" />
      </div>

      {error ? (
        <Notice tone="bad" title="Could not load the slides">
          {error}
        </Notice>
      ) : leads === null ? (
        <div className="overflow-hidden rounded-xl border border-[var(--crm-line)]" aria-busy="true" aria-label="Loading slides">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 border-b border-[var(--crm-line)] px-4 py-3 last:border-0">
              <div className="crm-skeleton size-10 rounded-lg" />
              <div className="crm-skeleton h-3 w-1/3 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <Table
          caption="Client slides"
          rows={shown}
          rowKey={(l) => l.id}
          href={(l) => `/contacts/${l.id}/deck`}
          empty={
            <Empty icon={Presentation} title={leads.length === 0 ? 'No leads yet' : 'No lead matches that search'}>
              {leads.length === 0 ? 'Slides appear here as soon as a lead comes in.' : 'Try a different name, or clear the search.'}
            </Empty>
          }
          columns={[
            {
              header: 'Lead',
              cell: (lead) => (
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--crm-line)] bg-white">
                    {lead.logo_v ? (
                      // eslint-disable-next-line @next/next/no-img-element -- a small private image served by the API
                      <img src={logoUrl(lead.id, lead.logo_v)} alt="" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <Presentation className="size-5 text-[#62626b]" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{lead.business_name || lead.name}</span>
                    {lead.business_name && lead.name !== lead.business_name && (
                      <span className="block truncate text-xs text-[var(--crm-muted)]">{lead.name}</span>
                    )}
                  </span>
                </span>
              ),
            },
            {
              header: 'Slides',
              align: 'right',
              cell: (lead) => (lead.edited ? <Badge tone="brand">Edited</Badge> : <span className="text-[var(--crm-muted)]">Not edited</span>),
            },
          ]}
        />
      )}
    </div>
  );
}
