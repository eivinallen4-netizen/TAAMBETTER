'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, Globe, Mail, Megaphone, MessageSquare, Palette, Pencil, Phone, Presentation, Search, Trash2, Video } from 'lucide-react';
import { useAdminAuth } from '@/lib/useAdminAuth';
import {
  BUDGET_OPTIONS,
  INDUSTRY_OPTIONS,
  LEAD_FIT_LABELS,
  ROLE_OPTIONS,
  STAGE_OPTIONS,
  TIMELINE_OPTIONS,
  optionLabel,
  type QualifierOption,
} from '@/app/lib/cta';
import { SendPanel } from '../../components/SendPanel';
import { LogoDrop, logoUrl } from '../../components/ContactLogo';
import { ContactStatus, FitBadge, STATUS_OPTIONS, recipientFor } from '../contact-ui';
import { INTERESTS, interestSource, parseInterests, type Interest } from '@/lib/interests';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  message: string | null;
  completion_status: string;
  timestamp: string;
  source_page: string | null;
  biggest_challenge: string | null;
  services_interested: string | null;
  industry: string | null;
  business_stage: string | null;
  budget: string | null;
  timeline: string | null;
  website: string | null;
  lead_fit: string | null;
  role: string | null;
  interests: string | null;
  /** What their data points to, while nobody has picked their interests yet. */
  interests_suggested: string;
  logo_v: string;
}

type Editable = Omit<Contact, 'id' | 'timestamp' | 'logo_v' | 'interests' | 'interests_suggested'>;
const EDIT_KEYS: (keyof Editable)[] = [
  'name', 'email', 'phone', 'business_name', 'website', 'completion_status', 'lead_fit', 'role', 'budget', 'timeline',
  'industry', 'business_stage', 'source_page', 'message', 'biggest_challenge', 'services_interested',
];

const FIT_OPTIONS: QualifierOption[] = Object.entries(LEAD_FIT_LABELS).map(([value, label]) => ({ value, label }));

function websiteHref(site: string) {
  const s = site.trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith('@')) return `https://instagram.com/${s.slice(1)}`;
  return `https://${s}`;
}

function Chip({ href, icon: Icon, children, copy }: { href?: string; icon: typeof Mail; children: React.ReactNode; copy?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="inline-flex max-w-full items-center overflow-hidden rounded-lg border border-gray-700 bg-gray-800/60 text-sm">
      <a
        href={href}
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel="noreferrer"
        className="flex min-w-0 items-center gap-2 px-3 py-1.5 text-gray-200 transition hover:bg-gray-700 hover:text-white"
      >
        <Icon className="h-4 w-4 shrink-0 text-[#F46325]" />
        <span className="truncate">{children}</span>
      </a>
      {copy && (
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(copy);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          title="Copy"
          className="border-l border-gray-700 px-2 py-1.5 text-gray-500 transition hover:bg-gray-700 hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      )}
    </span>
  );
}

const INTEREST_ICONS: Record<Interest, typeof Mail> = {
  website: Globe,
  organic: Video,
  gbp_seo: Search,
  paid_ads: Megaphone,
  branding: Palette,
};

/** The five interest buttons. Suggested ones (nobody has picked yet) show lit with a dashed edge. */
function InterestButtons({ contact, onChange }: { contact: Contact; onChange: (next: Interest[]) => void }) {
  const suggested = !contact.interests;
  const on = parseInterests(contact.interests || contact.interests_suggested);
  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {INTERESTS.map((i) => {
          const Icon = INTEREST_ICONS[i.value];
          const active = on.includes(i.value);
          return (
            <button
              key={i.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? on.filter((x) => x !== i.value) : [...on, i.value])}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                active
                  ? `${suggested ? 'border-dashed' : ''} border-[#F46325] bg-[#F46325]/15 text-white hover:bg-[#F46325]/25`
                  : 'border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${active ? 'text-[#F46325]' : ''}`} />
              {i.label}
            </button>
          );
        })}
      </div>
      {on.length > 0 && (
        <p className="mt-1.5 text-[11px] text-gray-500">
          {suggested ? `Suggested from ${interestSource(contact)}. Click to confirm or change.` : 'What they’re interested in. Click to change.'}
        </p>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">{label}</dt>
      <dd className={`mt-0.5 text-sm ${value ? 'text-white' : 'text-gray-600'}`}>{value || '—'}</dd>
    </div>
  );
}

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-gray-800 bg-gray-900/60 p-5 sm:p-6 ${className}`}>
      <h2 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-gray-400">{title}</h2>
      {children}
    </section>
  );
}

export default function ContactDetailsPage() {
  useAdminAuth();
  const router = useRouter();
  const params = useParams();
  const contactId = params.id as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Contact>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchContact();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  async function fetchContact() {
    setError(null);
    try {
      const res = await fetch(`/api/admin/contacts/${contactId}`, { cache: 'no-store' });
      if (!res.ok) {
        setError(res.status === 404 ? 'Contact not found' : 'Failed to load contact');
        return;
      }
      const data = await res.json();
      setContact(data);
      setFormData(data);
    } catch (err) {
      setError('Failed to load contact');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function patch(updates: Record<string, unknown>) {
    const res = await fetch(`/api/admin/contacts/${contactId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save contact');
    setContact(data);
    return data as Contact;
  }

  async function saveLogo(logo: string) {
    await patch({ logo });
  }

  async function saveInterests(next: Interest[]) {
    if (!contact) return;
    const before = contact;
    setContact({ ...contact, interests: next.join(', ') || 'none' });
    try {
      await patch({ interests: next });
    } catch (err) {
      setContact(before);
      setError(err instanceof Error ? err.message : 'Failed to save interests');
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!contact) return;
    setIsSaving(true);
    setError(null);
    try {
      const updates = Object.fromEntries(EDIT_KEYS.map((k) => [k, formData[k] ?? '']));
      const updated = await patch(updates);
      setFormData(updated);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/admin/contacts/${contactId}`, { method: 'DELETE' });
      if (!res.ok) {
        setError('Failed to delete contact');
        return;
      }
      router.push('/admin/contacts');
    } catch (err) {
      setError('Failed to delete contact');
      console.error('Delete error:', err);
    }
  }

  const back = (
    <Link href="/admin/contacts" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-400 transition hover:text-white">
      <ArrowLeft className="h-4 w-4" /> All contacts
    </Link>
  );

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-gray-500">Loading…</div>;
  }

  if (!contact) {
    return (
      <div className="mx-auto max-w-5xl">
        {back}
        <div className="rounded-xl border border-red-700 bg-red-900/20 p-4 text-red-400">{error || 'Contact not found'}</div>
      </div>
    );
  }

  const input = 'w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-[#F46325] focus:outline-none';
  const field = (key: keyof Editable, label: string, type = 'text') => (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-gray-400">{label}</span>
      <input type={type} className={input} value={formData[key] ?? ''} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} />
    </label>
  );
  const select = (key: keyof Editable, label: string, options: QualifierOption[]) => (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-gray-400">{label}</span>
      <select className={input} value={formData[key] ?? ''} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}>
        <option value="">—</option>
        {/* Keep a value the form doesn't know about, so saving doesn't wipe it. */}
        {formData[key] && !options.some((o) => o.value === formData[key]) && <option value={formData[key] ?? ''}>{formData[key]}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
  const area = (key: keyof Editable, label: string) => (
    <label className="block sm:col-span-2">
      <span className="mb-1 block text-xs font-bold text-gray-400">{label}</span>
      <textarea rows={3} className={`${input} resize-y`} value={formData[key] ?? ''} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} />
    </label>
  );

  const title = contact.business_name || contact.name;
  const created = new Date(contact.timestamp);

  return (
    <div className="mx-auto max-w-5xl">
      {back}

      {/* Header */}
      <section className="relative mb-6 overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900 via-gray-900 to-[#F46325]/10 p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <LogoDrop src={logoUrl(contact.id, contact.logo_v)} name={contact.name} business={contact.business_name ?? ''} onChange={saveLogo} pasteAnywhere={!isEditing} />

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <ContactStatus status={contact.completion_status} />
              <FitBadge fit={contact.lead_fit} />
            </div>
            <h1 className="break-words text-3xl font-black leading-tight tracking-tight sm:text-4xl">{title}</h1>
            {contact.business_name && (
              <p className="mt-1 text-gray-300">
                {contact.name}
                {contact.role && <span className="text-gray-500"> · {optionLabel(ROLE_OPTIONS, contact.role).replace(/^I('m| work| run)\s*/i, '')}</span>}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Chip href={`mailto:${contact.email}`} icon={Mail} copy={contact.email}>
                {contact.email}
              </Chip>
              {contact.phone && (
                <Chip href={`tel:${contact.phone}`} icon={Phone} copy={contact.phone}>
                  {contact.phone}
                </Chip>
              )}
              {contact.phone && (
                <Chip href={`sms:${contact.phone}`} icon={MessageSquare}>
                  Text
                </Chip>
              )}
              {contact.website && (
                <Chip href={websiteHref(contact.website)} icon={Globe}>
                  {contact.website.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')}
                </Chip>
              )}
            </div>
            <InterestButtons contact={contact} onChange={saveInterests} />
          </div>

          <div className="flex gap-2 sm:flex-col">
            <Link
              href={`/admin/contacts/${contact.id}/deck`}
              className="flex items-center gap-2 rounded-lg bg-[#F46325] px-3 py-2 text-sm font-black text-white transition hover:bg-[#FF7B42]"
            >
              <Presentation className="h-4 w-4" /> Slides
            </Link>
            <button
              type="button"
              onClick={() => {
                setFormData(contact);
                setIsEditing(!isEditing);
              }}
              className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm font-bold text-gray-200 transition hover:border-gray-500 hover:text-white"
            >
              <Pencil className="h-4 w-4" /> {isEditing ? 'Close' : 'Edit'}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-800 px-3 py-2 text-sm font-bold text-gray-500 transition hover:border-red-800 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
        {!contact.logo_v && !isEditing && (
          <p className="mt-4 text-xs text-gray-500">Tip: copy their logo from their website and press Ctrl+V anywhere on this page.</p>
        )}
      </section>

      {error && <div className="mb-6 rounded-xl border border-red-700 bg-red-900/20 p-4 text-sm text-red-400">{error}</div>}

      {isEditing ? (
        <form onSubmit={handleSave}>
          <Card title="Edit contact" className="mb-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {field('name', 'Name')}
              {field('business_name', 'Business')}
              {field('email', 'Email', 'email')}
              {field('phone', 'Phone', 'tel')}
              {field('website', 'Website / Instagram')}
              {select('completion_status', 'Status', STATUS_OPTIONS)}
              {select('lead_fit', 'Lead fit', FIT_OPTIONS)}
              {select('role', 'Role', ROLE_OPTIONS)}
              {select('budget', 'Monthly budget', BUDGET_OPTIONS)}
              {select('timeline', 'Timeline', TIMELINE_OPTIONS)}
              {select('industry', 'Industry', INDUSTRY_OPTIONS)}
              {select('business_stage', 'Time in business', STAGE_OPTIONS)}
              {area('message', 'Message / notes')}
              {field('biggest_challenge', 'Biggest challenge')}
              {field('services_interested', 'Services interested')}
              {field('source_page', 'Came from')}
            </div>
            <div className="mt-6 flex gap-3">
              <button type="submit" disabled={isSaving} className="flex-1 rounded-lg bg-[#F46325] py-3 font-bold text-white transition hover:bg-[#FF7B42] disabled:opacity-50">
                {isSaving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData(contact);
                }}
                disabled={isSaving}
                className="rounded-lg border border-gray-700 px-6 py-3 font-bold text-gray-300 transition hover:border-gray-500 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </Card>
        </form>
      ) : (
        <>
          <SendPanel recipient={recipientFor(contact)} onSent={fetchContact} />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <Card title="What they told us">
              {contact.message || contact.biggest_challenge ? (
                <div className="space-y-5">
                  {contact.message && <p className="whitespace-pre-wrap leading-relaxed text-gray-100">{contact.message}</p>}
                  {contact.biggest_challenge && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Biggest challenge</p>
                      <p className="mt-1 text-white">{contact.biggest_challenge}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nothing yet. Use Edit to add notes.</p>
              )}
            </Card>

            <Card title="About the business">
              <dl className="space-y-4">
                <Fact label="Monthly budget" value={optionLabel(BUDGET_OPTIONS, contact.budget)} />
                <Fact label="Timeline" value={optionLabel(TIMELINE_OPTIONS, contact.timeline)} />
                <Fact label="Industry" value={optionLabel(INDUSTRY_OPTIONS, contact.industry)} />
                <Fact label="Time in business" value={optionLabel(STAGE_OPTIONS, contact.business_stage)} />
                <Fact label="Came from" value={contact.source_page} />
                <Fact
                  label="First contact"
                  value={Number.isNaN(created.getTime()) ? contact.timestamp : created.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                />
              </dl>
            </Card>
          </div>
        </>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="w-full max-w-sm rounded-xl border border-gray-700 bg-gray-900 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-xl font-black text-white">Delete {title}?</h2>
            <p className="mb-6 text-sm text-gray-400">This permanently removes the contact and their logo. Emails already sent stay in your history.</p>
            <div className="flex gap-3">
              <button type="button" onClick={handleDelete} className="flex-1 rounded-lg bg-red-900 py-2.5 font-bold text-red-200 transition hover:bg-red-800">
                Delete
              </button>
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-lg border border-gray-700 py-2.5 font-bold text-gray-300 transition hover:border-gray-500">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
