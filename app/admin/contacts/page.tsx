'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Mail, Phone, Plus, Search, Send, Users } from 'lucide-react';
import { useAdminAuth } from '@/lib/useAdminAuth';
import { BUDGET_OPTIONS, optionLabel } from '@/app/lib/cta';
import { ExportCsvButton } from '../components/ExportCsvButton';
import { SendModal, type Recipient } from '../components/SendModal';
import { ContactAvatar, logoUrl } from '../components/ContactLogo';
import { AddContactModal } from './AddContactModal';
import { ContactStatus, FitBadge, recipientFor } from './contact-ui';
import { INTERESTS, parseInterests } from '@/lib/interests';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  completion_status: string;
  timestamp: string;
  source_page: string | null;
  budget: string | null;
  website: string | null;
  lead_fit: string | null;
  interests: string | null;
  logo_v: string;
}

const FILTERS = [
  { value: '', label: 'Everyone' },
  { value: 'paid', label: 'Paid clients' },
  { value: 'strong', label: 'Strong fit' },
  { value: 'complete', label: 'Filled out form' },
  { value: 'partial', label: 'Started form' },
];

const SORTS = [
  { value: 'timestamp:desc', label: 'Newest first' },
  { value: 'timestamp:asc', label: 'Oldest first' },
  { value: 'name:asc', label: 'Name A–Z' },
  { value: 'business_name:asc', label: 'Business A–Z' },
  { value: 'lead_fit:desc', label: 'Lead fit' },
];

const LIMIT = 50;

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return '';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return mins <= 1 ? 'just now' : `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ContactsPage() {
  useAdminAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState(SORTS[0].value);
  const [offset, setOffset] = useState(0);
  const [sendTo, setSendTo] = useState<Recipient | null | undefined>(undefined);
  const [adding, setAdding] = useState(false);

  const fetchContacts = useCallback(async () => {
    const [sort, dir] = sortKey.split(':');
    const params = new URLSearchParams({ search, filter, limit: String(LIMIT), offset: String(offset), sort, dir });
    try {
      const res = await fetch(`/api/admin/contacts?${params}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setContacts(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoaded(true);
    }
  }, [search, filter, sortKey, offset]);

  useEffect(() => {
    const t = setTimeout(fetchContacts, search ? 200 : 0);
    const interval = setInterval(fetchContacts, 15000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [fetchContacts, search]);

  const page = Math.floor(offset / LIMIT) + 1;
  const pages = Math.ceil(total / LIMIT) || 1;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#F46325]">CRM</p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Contacts</h1>
          <p className="mt-1 text-sm text-gray-400">
            {total} {total === 1 ? 'person' : 'people'} from the contact form, free tools, and ones you added.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSendTo(null)}
            className="flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-bold text-gray-200 transition hover:border-[#F46325] hover:text-white"
          >
            <Send className="h-4 w-4 text-[#F46325]" /> Send something
          </button>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 rounded-lg bg-[#F46325] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#FF7B42]"
          >
            <Plus className="h-4 w-4" /> Add contact
          </button>
        </div>
      </header>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            placeholder="Search name, email, business, phone or website…"
            className="w-full rounded-lg border border-gray-700 bg-gray-900 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 focus:border-[#F46325] focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sortKey}
            onChange={(e) => {
              setSortKey(e.target.value);
              setOffset(0);
            }}
            aria-label="Sort"
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-gray-200 focus:border-[#F46325] focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <ExportCsvButton dataset="contacts" search={search} />
        </div>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => {
              setFilter(f.value);
              setOffset(0);
            }}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
              filter === f.value ? 'border-[#F46325] bg-[#F46325] text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!loaded ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-10 text-center text-gray-500">Loading…</div>
      ) : contacts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 p-12 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-gray-600" />
          <p className="font-bold text-white">{search || filter ? 'Nobody matches that.' : 'No contacts yet.'}</p>
          <p className="mt-1 text-sm text-gray-500">Add someone by hand, or they’ll show up here when they fill out the contact form or a free tool.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-800 overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60">
          {contacts.map((c) => {
            const budget = optionLabel(BUDGET_OPTIONS, c.budget);
            return (
              <li key={c.id} className="group relative flex items-center gap-4 px-4 py-3.5 transition hover:bg-gray-800/60 sm:px-5">
                <ContactAvatar src={logoUrl(c.id, c.logo_v)} name={c.name} business={c.business_name ?? ''} size="md" />

                <div className="min-w-0 flex-1">
                  <Link href={`/admin/contacts/${c.id}`} className="block after:absolute after:inset-0">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="truncate text-base font-black text-white">{c.business_name || c.name}</span>
                      <ContactStatus status={c.completion_status} />
                      <FitBadge fit={c.lead_fit} />
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-gray-400">
                      {c.business_name ? `${c.name} · ` : ''}
                      {c.email}
                    </span>
                  </Link>
                  <span className="mt-1 flex flex-wrap gap-x-3 text-xs text-gray-500">
                    {parseInterests(c.interests).map((i) => (
                      <span key={i} className="font-bold text-[#FF9A66]">{INTERESTS.find((x) => x.value === i)?.short}</span>
                    ))}
                    {budget && <span>{budget}/mo</span>}
                    {c.source_page && <span className="truncate">{c.source_page}</span>}
                    <span>{timeAgo(c.timestamp)}</span>
                  </span>
                </div>

                {/* Quick actions sit above the row link. */}
                <div className="relative z-10 flex shrink-0 items-center gap-1">
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      title={`Call ${c.phone}`}
                      className="hidden rounded-lg p-2 text-gray-500 transition hover:bg-gray-700 hover:text-white sm:block"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                  <a
                    href={`mailto:${c.email}`}
                    title={`Email ${c.email} yourself`}
                    className="hidden rounded-lg p-2 text-gray-500 transition hover:bg-gray-700 hover:text-white sm:block"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setSendTo(recipientFor(c))}
                    className="flex items-center gap-1.5 rounded-lg border border-[#F46325]/50 px-3 py-2 text-xs font-bold text-[#FF9A66] transition hover:bg-[#F46325] hover:text-white"
                  >
                    <Send className="h-3.5 w-3.5" /> Send
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <div className="mt-5 flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => setOffset(Math.max(0, offset - LIMIT))}
            disabled={offset === 0}
            className="flex items-center gap-1 rounded-lg border border-gray-700 px-3 py-2 text-gray-300 hover:border-gray-500 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <span className="text-gray-500">
            Page {page} of {pages}
          </span>
          <button
            type="button"
            onClick={() => setOffset(offset + LIMIT)}
            disabled={offset + LIMIT >= total}
            className="flex items-center gap-1 rounded-lg border border-gray-700 px-3 py-2 text-gray-300 hover:border-gray-500 disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {sendTo !== undefined && (
        <SendModal recipient={sendTo ?? undefined} defaultType={sendTo?.paid ? 'website_onboarding' : 'zoom'} onClose={() => setSendTo(undefined)} onSent={fetchContacts} />
      )}
      {adding && <AddContactModal onClose={() => setAdding(false)} />}
    </div>
  );
}
