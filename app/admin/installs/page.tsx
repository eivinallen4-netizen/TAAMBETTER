'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Building2, ExternalLink, KeyRound, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Empty,
  Field,
  Input,
  Loaded,
  Modal,
  Notice,
  PageHeader,
  Stat,
  callOp,
  can,
  useBoot,
  useConfirm,
  useOp,
  useToast,
} from '@taam/crm/client';

// Client installs: every client CRM TAAM runs, with its live status, headline numbers and a
// one-click link to its admin. The data comes from the taam-installs module
// (lib/crm-site/installs/module.ts); API keys stay on the server, this page only sees key_hint.
//
// Styling note: this page is compiled by the website's Tailwind, whose theme also defines
// `surface` and `radius-card`. So containers here use the kit's <Card>, and the page never
// writes bg-surface or rounded-card itself; every other token class it uses comes from the CRM's
// own stylesheet.

type Tone = 'neutral' | 'brand' | 'ok' | 'warn' | 'bad';

interface MoneyCount {
  count: number;
  balance_cents: number;
}

interface Summary {
  crm: { version: string };
  schema_version?: string | number | null;
  company?: { name?: string; timezone?: string; currency?: string };
  industry?: string;
  modules?: string[];
  links?: { admin?: string };
  counts?: {
    clients?: number | null;
    open_leads?: number | null;
    new_requests?: number | null;
    requests_this_month?: number | null;
    open_jobs?: number | null;
    quotes_awaiting?: number | null;
    unpaid_invoices?: MoneyCount | null;
    overdue_invoices?: MoneyCount | null;
  };
  generated_at?: string;
}

interface Install {
  id: string;
  name: string;
  site_url: string;
  api_path: string;
  admin_url: string;
  key_hint: string;
  status: string;
  last_error: string;
  version: string;
  summary: Summary | null;
  last_checked_at: string | null;
  last_ok_at: string | null;
}

interface ListResult {
  installs: Install[];
  key_configured: boolean;
  stale_after_minutes: number;
  /** The server's clock when the list was read. */
  now?: string;
}

const PERMISSION = 'installs:manage';

const STATUS: Record<string, { label: string; tone: Tone }> = {
  ok: { label: 'Live', tone: 'ok' },
  unreachable: { label: 'Unreachable', tone: 'bad' },
  unauthorized: { label: 'Key rejected', tone: 'bad' },
  forbidden: { label: 'Key lacks access', tone: 'warn' },
  outdated: { label: 'Needs update', tone: 'warn' },
  rate_limited: { label: 'Rate limited', tone: 'warn' },
  error: { label: 'Error', tone: 'bad' },
  unknown: { label: 'Not checked', tone: 'neutral' },
};

const statusOf = (status: string) => STATUS[status] ?? STATUS.unknown;

function ago(iso: string | null): string {
  if (!iso) return 'never';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return 'never';
  const min = Math.round(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

function money(cents: number, currency?: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(cents / 100);
  } catch {
    return `$${Math.round(cents / 100).toLocaleString('en-US')}`;
  }
}

const hostOf = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

/** Only http(s) links are ever rendered as "Open admin". */
const safeHref = (url: string) => (/^https?:\/\//i.test(url) ? url : '');

/** `skewMs` is how far the viewer's clock runs ahead of the server's, so only server times are compared. */
function isStale(install: Install, minutes: number, skewMs: number): boolean {
  if (!install.last_checked_at) return true;
  return Date.now() - skewMs - new Date(install.last_checked_at).getTime() > minutes * 60000;
}

// ---------- Pieces ----------

function MiniStat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: Tone }) {
  const color = tone === 'bad' ? 'text-bad' : tone === 'warn' ? 'text-warn' : tone === 'ok' ? 'text-ok' : tone === 'brand' ? 'text-brand-ink' : 'text-ink';
  return (
    <div className="min-w-0 rounded-control border border-line bg-raised px-3 py-2.5">
      <p className="crm-eyebrow truncate">{label}</p>
      <p className={`mt-0.5 text-xl font-black tracking-tight tabular-nums ${color}`}>{value}</p>
      {hint && <p className="truncate text-xs text-muted">{hint}</p>}
    </div>
  );
}

const off = <span className="text-muted" title="This module is off on that install">—</span>;

function InstallStats({ summary }: { summary: Summary | null }) {
  const c = summary?.counts ?? {};
  const currency = summary?.company?.currency;
  const n = (v: number | null | undefined) => (typeof v === 'number' ? v.toLocaleString('en-US') : off);
  const unpaid = c.unpaid_invoices;
  const overdue = c.overdue_invoices;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <MiniStat label="Clients" value={n(c.clients)} />
      <MiniStat label="Open leads" value={n(c.open_leads)} />
      <MiniStat
        label="New requests"
        value={n(c.new_requests)}
        hint={typeof c.requests_this_month === 'number' ? `${c.requests_this_month} this month` : undefined}
        tone={(c.new_requests ?? 0) > 0 ? 'brand' : undefined}
      />
      <MiniStat label="Open jobs" value={n(c.open_jobs)} hint={typeof c.quotes_awaiting === 'number' ? `${c.quotes_awaiting} quotes awaiting` : undefined} />
      <MiniStat label="Unpaid" value={unpaid ? money(unpaid.balance_cents, currency) : off} hint={unpaid ? `${unpaid.count} invoice${unpaid.count === 1 ? '' : 's'}` : undefined} />
      <MiniStat
        label="Overdue"
        value={overdue ? money(overdue.balance_cents, currency) : off}
        hint={overdue ? `${overdue.count} invoice${overdue.count === 1 ? '' : 's'}` : undefined}
        tone={overdue && overdue.count > 0 ? 'bad' : undefined}
      />
    </div>
  );
}

// Same look as the kit's secondary small button; an <a> because it opens another site in a new tab.
const OPEN_CLASS =
  'inline-flex min-h-8 select-none items-center justify-center gap-2 rounded-control border border-field bg-raised px-2.5 py-1.5 text-xs font-bold whitespace-nowrap text-ink transition hover:border-muted';

function InstallCard({
  install,
  busy,
  onRefresh,
  onEdit,
  onRemove,
}: {
  install: Install;
  busy: boolean;
  onRefresh: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const status = statusOf(install.status);
  const href = safeHref(install.admin_url);
  const company = install.summary?.company;
  return (
    <Card
      title={install.name || hostOf(install.site_url)}
      subtitle={
        <span className="flex flex-wrap items-center gap-x-2">
          <span>{hostOf(install.site_url)}</span>
          {install.version && <span aria-label={`CRM version ${install.version}`}>· v{install.version}</span>}
          {install.summary?.industry && <span className="capitalize">· {install.summary.industry}</span>}
        </span>
      }
      action={
        <Badge tone={status.tone} dot>
          {busy ? 'Checking…' : status.label}
        </Badge>
      }
      footer={
        <>
          <Button size="sm" variant="danger" onClick={onRemove} aria-label={`Remove ${install.name}`} className="mr-auto">
            <Trash2 className="size-3.5" aria-hidden />
            Remove
          </Button>
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Pencil className="size-3.5" aria-hidden />
            Edit
          </Button>
          <Button size="sm" onClick={onRefresh} busy={busy}>
            {!busy && <RefreshCw className="size-3.5" aria-hidden />}
            Refresh
          </Button>
          {href && (
            <a href={href} target="_blank" rel="noopener noreferrer" className={OPEN_CLASS}>
              Open admin
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
        </>
      }
    >
      <div className="space-y-3">
        {install.status !== 'ok' && install.last_error && (
          <Notice tone={status.tone === 'bad' ? 'bad' : 'warn'} title={status.label}>
            {install.last_error}
            {install.last_ok_at && <span className="block text-xs opacity-80">Numbers below are from {ago(install.last_ok_at)}.</span>}
          </Notice>
        )}
        {install.summary ? <InstallStats summary={install.summary} /> : <p className="text-sm text-muted">No numbers yet. Refresh to check this install.</p>}
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span>Checked {ago(install.last_checked_at)}</span>
          <span className="inline-flex items-center gap-1">
            <KeyRound className="size-3" aria-hidden />
            Key ending {install.key_hint || '????'}
          </span>
          {company?.timezone && <span>{company.timezone}</span>}
        </p>
      </div>
    </Card>
  );
}

// ---------- Add / edit ----------

function InstallModal({ editing, onClose, onSaved }: { editing: Install | null; onClose: () => void; onSaved: (install: Install, added: boolean) => void }) {
  const boot = useBoot();
  const [site, setSite] = useState(editing?.site_url ?? '');
  const [apiKey, setApiKey] = useState('');
  const [name, setName] = useState(editing?.name ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setBusy(true);
    setError('');
    try {
      if (editing) {
        const input: Record<string, string> = { id: editing.id, name: name.trim() };
        if (site.trim() && site.trim() !== editing.site_url) input.site_url = site.trim();
        if (apiKey.trim()) input.api_key = apiKey.trim();
        const result = await callOp<{ install: Install }>(boot, 'update_client_install', input);
        onSaved(result.install, false);
      } else {
        const input: Record<string, string> = { site_url: site.trim(), api_key: apiKey.trim() };
        if (name.trim()) input.name = name.trim();
        const result = await callOp<{ install: Install }>(boot, 'add_client_install', input);
        onSaved(result.install, true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  // The saved key is only sent to the address it was saved for, so a new address needs its own key.
  const siteChanged = Boolean(editing && site.trim() && site.trim() !== editing.site_url);
  const canSave = editing ? !siteChanged || Boolean(apiKey.trim()) : Boolean(site.trim() && apiKey.trim());
  return (
    <Modal
      title={editing ? `Edit ${editing.name || hostOf(editing.site_url)}` : 'Connect a client install'}
      description={editing ? 'A new address or key is checked before it is saved.' : 'We check the install before saving it.'}
      onClose={busy ? () => undefined : onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} busy={busy} busyLabel="Checking…" disabled={!canSave}>
            {editing ? 'Save' : 'Connect'}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSave && !busy) void save();
        }}
      >
        {error && <Notice>{error}</Notice>}
        <Field label="Site address" required hint="The client's CRM site, e.g. https://crm.clientsite.com">
          <Input
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={site}
            onChange={(e) => setSite(e.target.value)}
            placeholder="https://"
            required
            autoFocus
          />
        </Field>
        <Field
          label="API key"
          required={!editing || siteChanged}
          hint={
            siteChanged
              ? 'A new address needs its own key: paste a key made on that install.'
              : editing
              ? `Leave blank to keep the key ending ${editing.key_hint || '????'}.`
              : 'On that install: Settings → API keys → new key with "Summary only" access.'
          }
        >
          <Input
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={editing && !siteChanged ? `••••${editing.key_hint}` : 'crm_…'}
            required={!editing || siteChanged}
          />
        </Field>
        <Field label="Name" hint="Shown on the card. Leave blank to use the company name the install reports.">
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        </Field>
        {/* Lets Enter submit the form. */}
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

// ---------- The screen ----------

function InstallsScreen() {
  const boot = useBoot();
  const toast = useToast();
  const confirm = useConfirm();
  const state = useOp<ListResult>('list_client_installs');
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(() => new Set());
  const [modal, setModal] = useState<{ editing: Install | null } | null>(null);
  const autoRunning = useRef(false);
  // When the last automatic check ran (viewer's clock). At most one per stale window, so a
  // check that keeps coming back stale can never loop.
  const lastAutoRun = useRef(0);
  const { reload } = state;

  const refreshAll = useCallback(
    async (quiet: boolean) => {
      if (autoRunning.current) return;
      autoRunning.current = true;
      setRefreshingAll(true);
      try {
        await callOp(boot, 'refresh_client_installs', {});
        reload();
        if (!quiet) toast('Every install checked');
      } catch (err) {
        if (!quiet) toast(err instanceof Error ? err.message : 'Could not refresh', { tone: 'bad' });
      } finally {
        autoRunning.current = false;
        setRefreshingAll(false);
      }
    },
    [boot, reload, toast]
  );

  // Fresh numbers without a click: whenever any install's last check is older than the
  // stale window (15 minutes), check them all. Looks again every minute while the page is open.
  const data = state.data;
  useEffect(() => {
    if (!data?.key_configured || data.installs.length === 0) return;
    const windowMs = data.stale_after_minutes * 60000;
    const serverNow = data.now ? new Date(data.now).getTime() : NaN;
    const skewMs = Number.isFinite(serverNow) ? Date.now() - serverNow : 0;
    const check = () => {
      if (Date.now() - lastAutoRun.current < windowMs) return;
      if (data.installs.some((i) => isStale(i, data.stale_after_minutes, skewMs))) {
        lastAutoRun.current = Date.now();
        void refreshAll(true);
      }
    };
    check();
    const timer = setInterval(check, 60000);
    return () => clearInterval(timer);
  }, [data, refreshAll]);

  async function refreshOne(install: Install) {
    setBusyIds((s) => new Set(s).add(install.id));
    try {
      const result = await callOp<{ install: Install }>(boot, 'refresh_client_install', { id: install.id });
      const status = statusOf(result.install.status);
      toast(result.install.status === 'ok' ? `${result.install.name} is live` : `${result.install.name}: ${status.label}`, {
        tone: result.install.status === 'ok' ? 'ok' : status.tone === 'bad' ? 'bad' : 'warn',
      });
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not refresh', { tone: 'bad' });
    } finally {
      setBusyIds((s) => {
        const next = new Set(s);
        next.delete(install.id);
        return next;
      });
    }
  }

  async function remove(install: Install) {
    const yes = await confirm({
      title: `Remove ${install.name || hostOf(install.site_url)}?`,
      body: 'It leaves this list and its saved API key is deleted. The client\'s CRM keeps running; revoke the key on that install as well.',
      confirmLabel: 'Remove',
      tone: 'danger',
    });
    if (!yes) return;
    try {
      await callOp(boot, 'remove_client_install', { id: install.id });
      toast(`${install.name} removed`);
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not remove it', { tone: 'bad' });
    }
  }

  const keyMissing = data ? !data.key_configured : false;
  const addButton = (
    <Button variant="primary" onClick={() => setModal({ editing: null })} disabled={keyMissing}>
      <Plus className="size-4" aria-hidden />
      Add install
    </Button>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Client installs"
        subtitle="Every client CRM we run, live: status, headline numbers and a one-click way in."
        actions={
          <>
            <Button onClick={() => void refreshAll(false)} busy={refreshingAll} busyLabel="Checking…" disabled={keyMissing || !data?.installs.length}>
              <RefreshCw className="size-4" aria-hidden />
              Refresh all
            </Button>
            {addButton}
          </>
        }
      />

      <Loaded state={state} skeleton="cards">
        {(list) => {
          const total = list.installs.length;
          const live = list.installs.filter((i) => i.status === 'ok').length;
          const attention = list.installs.filter((i) => i.status !== 'ok' && i.status !== 'unknown').length;
          const newestCheck = list.installs.map((i) => i.last_checked_at).filter((v): v is string => Boolean(v)).sort().pop() ?? null;
          const overdue = list.installs.reduce((sum, i) => sum + (i.summary?.counts?.overdue_invoices?.count ?? 0), 0);
          return (
            <div className="space-y-6">
              {!list.key_configured && (
                <Notice tone="warn" title="CRM_INSTALLS_KEY is not set">
                  Add a CRM_INSTALLS_KEY of at least 32 random characters to this server&apos;s environment. Client install keys are stored encrypted with it, so
                  nothing can be added or checked until it is there.
                </Notice>
              )}

              {total === 0 ? (
                <Card>
                  <Empty title="No client installs yet" icon={Building2} action={list.key_configured ? addButton : undefined}>
                    Connect a client&apos;s CRM with its address and a &quot;Summary only&quot; API key made on that install. Its status and numbers show up here.
                  </Empty>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Stat label="Installs" value={total} icon={Building2} />
                    <Stat label="Live" value={live} tone={live === total ? 'ok' : undefined} />
                    <Stat label="Need attention" value={attention} tone={attention > 0 ? 'bad' : undefined} hint={attention > 0 ? 'See the cards below' : 'All clear'} />
                    <Stat label="Overdue invoices" value={overdue} tone={overdue > 0 ? 'warn' : undefined} hint={`Checked ${ago(newestCheck)}`} />
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {list.installs.map((install) => (
                      <InstallCard
                        key={install.id}
                        install={install}
                        busy={busyIds.has(install.id) || refreshingAll}
                        onRefresh={() => void refreshOne(install)}
                        onEdit={() => setModal({ editing: install })}
                        onRemove={() => void remove(install)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        }}
      </Loaded>

      {modal && (
        <InstallModal
          key={modal.editing?.id ?? 'new'}
          editing={modal.editing}
          onClose={() => setModal(null)}
          onSaved={(install, added) => {
            setModal(null);
            toast(added ? `${install.name} connected` : `${install.name} saved`);
            reload();
          }}
        />
      )}
    </div>
  );
}

export default function ClientInstallsPage() {
  const boot = useBoot();
  if (!can(boot, PERMISSION)) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Client installs" />
        <Notice tone="warn" title="Owner only">
          Only the owner can see and manage the client CRM installs.
        </Notice>
      </div>
    );
  }
  return <InstallsScreen />;
}
