'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, Check, Copy, ExternalLink, Eye, EyeOff, Lock, Trash2 } from 'lucide-react';
import { useAdminAuth } from '@/lib/useAdminAuth';
import {
  ONBOARDING_STATUSES,
  STATUS_LABELS,
  WEBSITE_PASSWORD_KEY,
  platformLabel,
  stepsFor,
  type OnboardingAnswers,
  type OnboardingKind,
  type PasswordMap,
} from '@/app/lib/onboarding';
import { StatusBadge } from '../../components/StatusBadge';
import { KindBadge } from '../../components/NewOnboardingModal';
import { SendPanel } from '../../components/SendPanel';

interface OnboardingDetail {
  id: string;
  kind: OnboardingKind;
  client_name: string;
  business_name: string;
  client_email: string;
  message: string;
  status: string;
  current_step: number;
  answers: OnboardingAnswers;
  admin_notes: string;
  created_at: string;
  updated_at: string;
  opened_at: string | null;
  submitted_at: string | null;
  paid_at: string | null;
  url: string;
  passwords: PasswordMap;
  passwordError: string;
}

function CopyIcon({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="text-gray-500 hover:text-white"
      aria-label="Copy"
      title="Copy"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function Secret({ value }: { value?: string }) {
  const [show, setShow] = useState(false);
  if (!value) return <span className="text-gray-600">—</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-mono">{show ? value : '••••••••'}</span>
      <button type="button" onClick={() => setShow((s) => !s)} className="text-gray-500 hover:text-white" aria-label={show ? 'Hide' : 'Show'}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <CopyIcon text={value} />
    </span>
  );
}

function ExtLink({ href }: { href: string }) {
  if (!href) return <span className="text-gray-600">—</span>;
  const url = /^https?:\/\//i.test(href) ? href : `https://${href.replace(/^@/, '')}`;
  const linkable = /^https?:\/\//i.test(href) || /\.[a-z]{2,}/i.test(href);
  return linkable ? (
    <a href={url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 break-all text-[#FF9A66] hover:underline">
      {href} <ExternalLink className="h-3.5 w-3.5 shrink-0" />
    </a>
  ) : (
    <span>{href}</span>
  );
}

function Card({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-700 bg-gray-900 p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-lg font-black uppercase tracking-wide">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[11rem_1fr]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-gray-400">{k}</dt>
          <dd className="whitespace-pre-line break-words text-gray-100">{v || <span className="text-gray-600">—</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function OnboardingDetailPage() {
  useAdminAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<OnboardingDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  const load = useCallback(
    () =>
      fetch(`/api/admin/onboarding/${id}`, { cache: 'no-store' })
        .then((res) => (res.ok ? (res.json() as Promise<OnboardingDetail>) : null))
        .then((d) => {
          if (!d) return setNotFound(true);
          setData(d);
          setNotes(d.admin_notes);
        }),
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/onboarding/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) await load();
    return res.ok;
  }

  async function remove() {
    if (!data) return;
    const typed = window.prompt(`Type DELETE to permanently remove ${data.client_name}'s onboarding and saved logins.`);
    if (typed !== 'DELETE') return;
    await fetch(`/api/admin/onboarding/${id}`, { method: 'DELETE' });
    router.push(listHref);
  }

  const listHref = data?.kind === 'social' ? '/admin/social' : data?.kind === 'website' ? '/admin/website' : '/admin';

  if (notFound) {
    return (
      <div>
        <Link href="/admin" className="text-[#F46325] hover:underline">
          ← Back
        </Link>
        <p className="mt-6 text-gray-400">Onboarding not found.</p>
      </div>
    );
  }
  if (!data) return <p className="text-gray-500">Loading…</p>;

  const a = data.answers;
  const pw = data.passwords;
  const otherLinks = a.website.otherLinks.split('\n').map((l) => l.trim()).filter(Boolean);
  const services = a.services.items.filter((it) => it.name.trim() || it.details.trim());
  const reviewLinks = a.reviews.links.filter((l) => l.url.trim());
  const stepLabel = stepsFor(data.kind)[data.current_step]?.label ?? '';
  const showSocial = data.kind !== 'website';
  const showWebsite = data.kind !== 'social';

  return (
    <div className="max-w-6xl">
      <Link href={listHref} className="mb-6 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> {data.kind === 'social' ? 'Social media onboarding' : data.kind === 'website' ? 'Website onboarding' : 'Dashboard'}
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black">{data.client_name}</h1>
            <StatusBadge status={data.status} />
            <KindBadge kind={data.kind} />
          </div>
          <p className="mt-1 text-lg text-gray-400">{a.business.businessName || data.business_name}</p>
          <p className="mt-2 text-sm text-gray-500">
            Created {new Date(data.created_at).toLocaleDateString()}
            {data.paid_at && ` · Paid ${new Date(data.paid_at).toLocaleDateString()}`}
            {data.opened_at && ` · Opened ${new Date(data.opened_at).toLocaleString()}`}
            {data.submitted_at ? ` · Submitted ${new Date(data.submitted_at).toLocaleString()}` : ` · On step: ${stepLabel}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={data.status}
            onChange={(e) => patch({ status: e.target.value })}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-[#F46325] focus:outline-none"
            aria-label="Status"
          >
            {ONBOARDING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm">
            <span className="max-w-[16rem] truncate font-mono text-gray-300">{data.url}</span>
            <CopyIcon text={data.url} />
            <a href={data.url} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white" aria-label="Open link">
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          <button type="button" onClick={remove} className="rounded-lg border border-gray-700 p-2 text-gray-500 hover:border-red-500 hover:text-red-400" aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {data.status === 'submitted' && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#F46325]/50 bg-[#F46325]/10 px-5 py-4">
          <p className="font-semibold">{data.client_name.split(' ')[0]} submitted everything. Review it below, then mark it complete.</p>
          <button type="button" onClick={() => patch({ status: 'complete' })} className="rounded-lg bg-[#F46325] px-4 py-2 text-sm font-bold hover:bg-[#FF7B42]">
            Mark complete
          </button>
        </div>
      )}
      {data.passwordError && <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 px-5 py-4 text-red-300">{data.passwordError}</div>}

      <SendPanel
        recipient={{ name: data.client_name, email: data.client_email, businessName: data.business_name, source: 'onboarding', sourceId: data.id, paid: !!data.paid_at }}
        onSent={load}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Business & contact">
          <Rows
            rows={[
              ['Business', a.business.businessName],
              ['Contact', a.business.contactName],
              ['Email', a.business.email && <a href={`mailto:${a.business.email}`} className="text-[#FF9A66] hover:underline">{a.business.email}</a>],
              ['Phone', a.business.phone && <a href={`tel:${a.business.phone}`} className="text-[#FF9A66] hover:underline">{a.business.phone}</a>],
              ['Best way to reach', a.business.bestContact],
              ['Industry', a.business.industry],
            ]}
          />
        </Card>

        <Card title={`What they offer (${services.length})`}>
          {services.length === 0 ? (
            <p className="text-sm text-gray-600">No services added yet.</p>
          ) : (
            <ul className="space-y-3">
              {services.map((it) => (
                <li key={it.id} className="rounded-md border border-gray-800 bg-gray-950/50 p-3 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-bold">{it.name || <span className="text-gray-600">Untitled</span>}</span>
                    {it.price && <span className="text-[#FFB38C]">{it.price}</span>}
                  </div>
                  {it.details && <p className="mt-1 text-gray-400">{it.details}</p>}
                </li>
              ))}
            </ul>
          )}
          {a.services.notes && (
            <div className="mt-5">
              <Rows rows={[['Notes', a.services.notes]]} />
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <Card title={`Reviews (${reviewLinks.length})`}>
          {reviewLinks.length === 0 ? (
            <p className="text-sm text-gray-600">No review links added yet.</p>
          ) : (
            <ul className="space-y-2">
              {reviewLinks.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 font-bold">{l.platform}</span>
                  <ExtLink href={l.url} />
                </li>
              ))}
            </ul>
          )}
          {a.reviews.favorites && (
            <div className="mt-5">
              <Rows rows={[['Favorite reviews', a.reviews.favorites]]} />
            </div>
          )}
        </Card>
      </div>

      {showSocial && (
      <div className="mt-6">
        <Card
          title={`Social logins (${a.social.length})`}
          right={
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Lock className="h-3.5 w-3.5" /> Encrypted at rest
            </span>
          }
        >
          {a.social.length === 0 ? (
            <p className="text-sm text-gray-600">No social accounts added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-700 text-xs uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="py-2 pr-4">Platform</th>
                    <th className="py-2 pr-4">Profile</th>
                    <th className="py-2 pr-4">Login</th>
                    <th className="py-2 pr-4">Password</th>
                    <th className="py-2 pr-4">2FA codes go to</th>
                    <th className="py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {a.social.map((s) => (
                    <tr key={s.id} className="border-b border-gray-800 align-top last:border-0">
                      <td className="py-3 pr-4 font-bold">{platformLabel(s)}</td>
                      <td className="py-3 pr-4">
                        <ExtLink href={s.handle} />
                      </td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex items-center gap-2">
                          {s.login || <span className="text-gray-600">—</span>} <CopyIcon text={s.login} />
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <Secret value={pw[s.id]} />
                      </td>
                      <td className="py-3 pr-4 text-gray-300">{s.twoFactor || <span className="text-gray-600">—</span>}</td>
                      <td className="py-3 text-gray-300">{s.notes || <span className="text-gray-600">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
      )}

      {showWebsite && (
      <div className="mt-6">
        <Card title="Website">
          <Rows
            rows={[
              ['Current site', a.website.currentUrl && <ExtLink href={a.website.currentUrl} />],
              ['Built on', a.website.platform],
              [
                'Other links',
                otherLinks.length > 0 && (
                  <ul className="space-y-1">
                    {otherLinks.map((l) => (
                      <li key={l}>
                        <ExtLink href={l} />
                      </li>
                    ))}
                  </ul>
                ),
              ],
              ['Domain bought at', a.website.domainProvider],
              ['Admin page', a.website.adminUrl && <ExtLink href={a.website.adminUrl} />],
              [
                'Login',
                a.website.login && (
                  <span className="inline-flex items-center gap-2">
                    {a.website.login} <CopyIcon text={a.website.login} />
                  </span>
                ),
              ],
              ['Password', pw[WEBSITE_PASSWORD_KEY] && <Secret value={pw[WEBSITE_PASSWORD_KEY]} />],
            ]}
          />
        </Card>

      </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Team notes">
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setNotesSaved(false);
            }}
            rows={5}
            placeholder="Private notes for the team. The client never sees these."
            className="w-full resize-y rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm text-white placeholder:text-gray-500 focus:border-[#F46325] focus:outline-none"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={async () => setNotesSaved(await patch({ admin_notes: notes }))}
              className="rounded-lg bg-[#F46325] px-4 py-2 text-sm font-bold hover:bg-[#FF7B42]"
            >
              Save notes
            </button>
            {notesSaved && <span className="text-sm text-emerald-400">Saved</span>}
          </div>
        </Card>

        <Card title="Note you sent">
          <p className="whitespace-pre-line text-sm text-gray-300">{data.message || <span className="text-gray-600">No personal note.</span>}</p>
        </Card>
      </div>
    </div>
  );
}
