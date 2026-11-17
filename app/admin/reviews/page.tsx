'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink, ImageIcon, Inbox, Link2, PenLine, Plus, Power, Send, Trash2, UserRound } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CopyButton,
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
import type { ReviewLink, ReviewRequest } from '@/lib/crm-site/reviews/module';

// Site reviews: make a review link for a client's website, send it, and work through what the
// client clicked and asked for. Rephrase, add TAAM's own requests, push them to Claude.
// Data comes from the taam-reviews module (lib/crm-site/reviews), which calls the review app.
//
// Styling note (same as the installs screen): this page is compiled by the website's Tailwind,
// whose theme also defines `surface` and `radius-card`, so containers use the kit's <Card> and
// the page only uses the CRM's own token classes (bg-raised, border-line, text-muted, …).

const PERMISSION = 'reviews:manage';

type Status = ReviewRequest['status'];
type Tone = 'neutral' | 'brand' | 'ok' | 'warn' | 'bad';

const STATUS: Record<Status, { label: string; tone: Tone }> = {
  new: { label: 'To review', tone: 'brand' },
  queued: { label: 'Pushed to Claude', tone: 'warn' },
  in_progress: { label: 'In progress', tone: 'neutral' },
  done: { label: 'Done', tone: 'ok' },
  wont_do: { label: 'Won’t do', tone: 'neutral' },
};

const FILTERS: { key: Status | 'all'; label: string }[] = [
  { key: 'new', label: 'To review' },
  { key: 'queued', label: 'Pushed to Claude' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'done', label: 'Done' },
  { key: 'wont_do', label: 'Won’t do' },
  { key: 'all', label: 'All' },
];

const TEXTAREA =
  'w-full rounded-control border border-field bg-raised px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none';
const CHIP = (on: boolean) =>
  `rounded-full border px-3 py-1.5 text-xs font-bold transition ${on ? 'border-brand bg-brand text-white' : 'border-line bg-raised text-muted hover:text-ink'}`;
const OPEN_CLASS =
  'inline-flex min-h-8 select-none items-center justify-center gap-2 rounded-control border border-field bg-raised px-2.5 py-1.5 text-xs font-bold whitespace-nowrap text-ink transition hover:border-muted';

const hostOf = (url: string | null) => {
  if (!url) return '';
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};
const when = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};
const safeHref = (url: string | null) => (url && /^https?:\/\//i.test(url) ? url : '');

interface LinksResult {
  configured: boolean;
  review_app_url: string | null;
  links: ReviewLink[];
}

// ---------- New link ----------

function NewLinkModal({ onClose, onCreated }: { onClose: () => void; onCreated: (link: ReviewLink) => void }) {
  const boot = useBoot();
  const [site, setSite] = useState('');
  const [label, setLabel] = useState('');
  const [client, setClient] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [made, setMade] = useState<ReviewLink | null>(null);

  async function save() {
    setBusy(true);
    setError('');
    try {
      const { link } = await callOp<{ link: ReviewLink }>(boot, 'create_review_link', {
        site_url: site.trim(),
        ...(label.trim() ? { label: label.trim() } : {}),
        ...(client.trim() ? { client_name: client.trim() } : {}),
      });
      setMade(link);
      onCreated(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not make the link');
    } finally {
      setBusy(false);
    }
  }

  if (made) {
    return (
      <Modal
        title="Review link ready"
        description="Send this to the client. They click what they want changed on their site and hit Send."
        onClose={onClose}
        footer={
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-control border border-line bg-raised p-2 pl-3">
            <code className="min-w-0 flex-1 truncate text-sm text-ink">{made.share_url}</code>
            <CopyButton text={made.share_url} label="Copy link" />
          </div>
          <p className="text-sm text-muted">
            {made.label} · {hostOf(made.site_url)}
            {made.client_name ? ` · ${made.client_name}` : ''}
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="New review link"
      description="One link per client site (or per round of changes)."
      onClose={busy ? () => undefined : onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} busy={busy} busyLabel="Making…" disabled={!site.trim()}>
            Make link
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (site.trim() && !busy) void save();
        }}
      >
        {error && <Notice>{error}</Notice>}
        <Field label="Client website" required hint="The page the client should start on, e.g. https://clientsite.com">
          <Input type="url" inputMode="url" autoComplete="off" spellCheck={false} value={site} onChange={(e) => setSite(e.target.value)} placeholder="https://" required autoFocus />
        </Field>
        <Field label="Name" hint="e.g. “Wave homepage round 2”. Blank uses the site’s address.">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={160} />
        </Field>
        <Field label="Client name" hint="Shown to them on the review page.">
          <Input value={client} onChange={(e) => setClient(e.target.value)} maxLength={160} />
        </Field>
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

// ---------- Add TAAM's own request ----------

function AddRequestModal({ link, onClose, onAdded }: { link: ReviewLink; onClose: () => void; onAdded: () => void }) {
  const boot = useBoot();
  const [note, setNote] = useState('');
  const [path, setPath] = useState('/');
  const [push, setPush] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setBusy(true);
    setError('');
    try {
      await callOp(boot, 'add_review_request', { link_id: link.id, note: note.trim(), page_path: path.trim() || '/', push });
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add it');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={`Add a request to ${link.label}`}
      description="Marked as TAAM’s own; the client doesn’t see it. To point at a specific element, use Open as TAAM instead."
      onClose={busy ? () => undefined : onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} busy={busy} disabled={!note.trim()}>
            Add request
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Notice>{error}</Notice>}
        <Field label="Page" hint="Path on the site, e.g. /about">
          <Input value={path} onChange={(e) => setPath(e.target.value)} spellCheck={false} />
        </Field>
        <Field label="What should change" required>
          <textarea className={TEXTAREA} rows={4} value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
        </Field>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" className="size-4 accent-[var(--crm-brand,#F46325)]" checked={push} onChange={(e) => setPush(e.target.checked)} />
          Push straight to Claude
        </label>
      </div>
    </Modal>
  );
}

// ---------- One request ----------

function RequestCard({
  r,
  showSite,
  checked,
  onCheck,
  onChanged,
}: {
  r: ReviewRequest;
  showSite: boolean;
  checked: boolean;
  onCheck: (on: boolean) => void;
  onChanged: () => void;
}) {
  const boot = useBoot();
  const toast = useToast();
  const confirm = useConfirm();
  const [mode, setMode] = useState<'view' | 'rephrase' | 'reply'>('view');
  const [note, setNote] = useState(r.note);
  const [reply, setReply] = useState(r.reply ?? '');
  const [busy, setBusy] = useState(false);
  const status = STATUS[r.status];
  const page = safeHref(r.page_url);

  async function update(patch: { status?: Status; note?: string; reply?: string }, message: string) {
    setBusy(true);
    try {
      await callOp(boot, 'update_review_requests', { ids: [r.id], ...patch });
      toast(message);
      setMode('view');
      onChanged();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save', { tone: 'bad' });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const yes = await confirm({ title: `Delete request #${r.id}?`, body: 'It disappears for the client too. This can’t be undone.', confirmLabel: 'Delete', tone: 'danger' });
    if (!yes) return;
    try {
      await callOp(boot, 'delete_review_request', { id: r.id });
      toast(`Request #${r.id} deleted`);
      onChanged();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not delete it', { tone: 'bad' });
    }
  }

  return (
    <div className={`flex gap-3 rounded-control border bg-raised p-4 ${checked ? 'border-brand' : 'border-line'}`}>
      <input
        type="checkbox"
        className="mt-1 size-4 shrink-0 accent-[var(--crm-brand,#F46325)]"
        checked={checked}
        onChange={(e) => onCheck(e.target.checked)}
        aria-label={`Select request ${r.id}`}
      />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span className="font-bold text-ink tabular-nums">#{r.id}</span>
          <Badge tone={status.tone} dot>
            {status.label}
          </Badge>
          <span className="inline-flex items-center gap-1">
            <UserRound className="size-3" aria-hidden />
            {r.author === 'host' ? 'TAAM' : 'Client'}
          </span>
          {(r.photos?.length ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1">
              <ImageIcon className="size-3" aria-hidden />
              {r.photos.length} photo{r.photos.length === 1 ? '' : 's'}
            </span>
          )}
          <span>{when(r.created_at)}</span>
          {showSite && r.link_label && <span className="font-semibold text-ink">{r.link_label}</span>}
          {page ? (
            <a href={page} target="_blank" rel="noopener noreferrer" className="font-mono hover:text-ink">
              {r.page_path}
            </a>
          ) : (
            <span className="font-mono">{r.page_path}</span>
          )}
        </div>

        {r.element && (
          <div className="rounded-control border border-line px-3 py-2 text-sm">
            <p className="text-ink">{r.element.text || <span className="text-muted">(no text)</span>}</p>
            {r.element.selector && (
              <p className="truncate font-mono text-xs text-muted" title={r.element.selector}>
                {r.element.selector}
              </p>
            )}
          </div>
        )}

        {mode === 'rephrase' ? (
          <div className="space-y-2">
            <textarea className={TEXTAREA} rows={4} value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="primary" busy={busy} disabled={!note.trim()} onClick={() => update({ note: note.trim(), status: 'queued' }, 'Saved and pushed to Claude')}>
                Save & push to Claude
              </Button>
              <Button size="sm" busy={busy} disabled={!note.trim()} onClick={() => update({ note: note.trim() }, 'Wording saved')}>
                Save wording
              </Button>
              <Button size="sm" variant="ghost" onClick={() => (setMode('view'), setNote(r.note))}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-[15px] text-ink">{r.note}</p>
        )}

        {(r.photos?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2">
            {r.photos.map((p) => (
              <div key={p.id} className="w-28">
                <a href={safeHref(p.url)} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-control border border-line" title={p.filename}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={safeHref(p.url)} alt={p.filename} loading="lazy" className="aspect-square w-full object-cover" />
                </a>
                <p className="mt-1 flex items-center justify-between gap-1 text-[11px] text-muted">
                  <span className="truncate">{p.width && p.height ? `${p.width}×${p.height}` : p.filename}</span>
                  <a href={`${safeHref(p.url)}?download=1`} className="shrink-0 font-semibold hover:text-ink" aria-label={`Download ${p.filename}`}>
                    <Download className="size-3.5" aria-hidden />
                  </a>
                </p>
              </div>
            ))}
          </div>
        )}

        {r.rephrased && (
          <p className="border-l-2 border-line pl-3 text-sm text-muted">
            <span className="font-semibold">Client wrote:</span> {r.original_note}
          </p>
        )}

        {mode === 'reply' ? (
          <div className="space-y-2">
            <textarea className={TEXTAREA} rows={2} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="What the client will read on their link" autoFocus />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="primary" busy={busy} onClick={() => update({ reply, status: 'done' }, 'Reply saved, marked done')}>
                Save & mark done
              </Button>
              <Button size="sm" busy={busy} onClick={() => update({ reply }, 'Reply saved')}>
                Save reply
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMode('view')}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          r.reply && (
            <p className="rounded-control bg-[color-mix(in_srgb,var(--color-ok,#22c55e)_14%,transparent)] px-3 py-2 text-sm text-ink">
              <span className="font-semibold">Reply to client:</span> {r.reply}
            </p>
          )
        )}

        {mode === 'view' && (
          <div className="flex flex-wrap gap-2 pt-1">
            {r.status !== 'queued' && r.status !== 'done' && (
              <Button size="sm" variant="primary" busy={busy} onClick={() => update({ status: 'queued' }, 'Pushed to Claude')}>
                <Send className="size-3.5" aria-hidden />
                Push to Claude
              </Button>
            )}
            <Button size="sm" onClick={() => setMode('rephrase')}>
              <PenLine className="size-3.5" aria-hidden />
              Rephrase
            </Button>
            <Button size="sm" onClick={() => setMode('reply')}>
              {r.reply ? 'Edit reply' : 'Reply'}
            </Button>
            {r.status !== 'done' && (
              <Button size="sm" variant="ghost" busy={busy} onClick={() => update({ status: 'done' }, 'Marked done')}>
                Mark done
              </Button>
            )}
            {r.status !== 'new' && (
              <Button size="sm" variant="ghost" busy={busy} onClick={() => update({ status: 'new' }, 'Back to review')}>
                Back to review
              </Button>
            )}
            {r.status !== 'wont_do' && r.status !== 'done' && (
              <Button size="sm" variant="ghost" busy={busy} onClick={() => update({ status: 'wont_do' }, 'Marked won’t do')}>
                Won’t do
              </Button>
            )}
            <Button size="sm" variant="danger" onClick={() => void remove()} className="ml-auto" aria-label={`Delete request ${r.id}`}>
              <Trash2 className="size-3.5" aria-hidden />
            </Button>
          </div>
        )}

        {r.element?.html && (
          <details className="text-xs text-muted">
            <summary className="cursor-pointer">Element HTML</summary>
            <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-control border border-line p-2">{r.element.html}</pre>
          </details>
        )}
      </div>
    </div>
  );
}

// ---------- Requests list (one link, or every link) ----------

function Requests({ link, onChanged }: { link: ReviewLink | null; onChanged: () => void }) {
  const boot = useBoot();
  const toast = useToast();
  const [filter, setFilter] = useState<Status | 'all'>('new');
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useMemo(() => ({ status: filter, ...(link ? { link_id: link.id } : {}) }), [filter, link]);
  const state = useOp<{ requests: ReviewRequest[] }>('list_review_requests', input);
  const { reload } = state;

  useEffect(() => setSelected([]), [filter, link]);

  const changed = () => {
    reload();
    onChanged();
  };

  async function bulk(status: Status, message: string) {
    setBusy(true);
    try {
      await callOp(boot, 'update_review_requests', { ids: selected, status });
      toast(message);
      setSelected([]);
      changed();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save', { tone: 'bad' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter requests">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" role="tab" aria-selected={filter === f.key} className={CHIP(filter === f.key)} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>
      <Loaded state={state} skeleton="cards">
        {({ requests }) =>
          requests.length === 0 ? (
            <Empty title={filter === 'new' ? 'Nothing waiting for review' : 'Nothing here'} icon={Inbox} compact>
              {filter === 'new' ? 'When a client sends changes from their review link, they show up here.' : 'Try another filter.'}
            </Empty>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 rounded-control border border-line bg-raised px-3 py-2">
                <label className="mr-auto flex items-center gap-2 text-sm font-semibold text-ink">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--crm-brand,#F46325)]"
                    checked={selected.length === requests.length}
                    onChange={(e) => setSelected(e.target.checked ? requests.map((r) => r.id) : [])}
                  />
                  {selected.length ? `${selected.length} selected` : `${requests.length} request${requests.length === 1 ? '' : 's'}`}
                </label>
                <Button size="sm" variant="primary" busy={busy} disabled={!selected.length} onClick={() => bulk('queued', `Pushed ${selected.length} to Claude`)}>
                  <Send className="size-3.5" aria-hidden />
                  Push to Claude
                </Button>
                <Button size="sm" busy={busy} disabled={!selected.length} onClick={() => bulk('new', 'Moved back to review')}>
                  Back to review
                </Button>
                <Button size="sm" variant="ghost" busy={busy} disabled={!selected.length} onClick={() => bulk('wont_do', 'Marked won’t do')}>
                  Won’t do
                </Button>
              </div>
              {requests.map((r) => (
                <RequestCard
                  key={`${r.id}-${r.updated_at}`}
                  r={r}
                  showSite={!link}
                  checked={selected.includes(r.id)}
                  onCheck={(on) => setSelected((s) => (on ? [...s, r.id] : s.filter((x) => x !== r.id)))}
                  onChanged={changed}
                />
              ))}
            </div>
          )
        }
      </Loaded>
    </div>
  );
}

// ---------- The screen ----------

function LinkRow({
  link,
  active,
  onSelect,
  onHost,
  onToggle,
  onAdd,
}: {
  link: ReviewLink;
  active: boolean;
  onSelect: () => void;
  onHost: () => void;
  onToggle: () => void;
  onAdd: () => void;
}) {
  const c = link.counts;
  return (
    <div className={`space-y-2 rounded-control border bg-raised p-3 ${active ? 'border-brand' : 'border-line'} ${link.active ? '' : 'opacity-60'}`}>
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <p className="truncate font-bold text-ink">{link.label}</p>
        <p className="truncate text-xs text-muted">
          {hostOf(link.site_url)}
          {link.client_name ? ` · ${link.client_name}` : ''}
          {link.active ? '' : ' · Off'}
        </p>
      </button>
      <div className="flex flex-wrap gap-1.5">
        {c && c.new > 0 && <Badge tone="brand">{c.new} to review</Badge>}
        {c && c.queued > 0 && <Badge tone="warn">{c.queued} with Claude</Badge>}
        {c && c.done > 0 && <Badge tone="ok">{c.done} done</Badge>}
        {c && c.total === 0 && <span className="text-xs text-muted">No requests yet</span>}
      </div>
      <div className="flex items-center gap-2 rounded-control border border-line px-2 py-1">
        <code className="min-w-0 flex-1 truncate text-xs text-muted">{link.share_url}</code>
        <CopyButton text={link.share_url} label="Copy" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" onClick={onHost} disabled={!link.active}>
          <ExternalLink className="size-3.5" aria-hidden />
          Open as TAAM
        </Button>
        <Button size="sm" variant="ghost" onClick={onAdd}>
          <Plus className="size-3.5" aria-hidden />
          Add request
        </Button>
        <Button size="sm" variant="ghost" onClick={onToggle} aria-label={link.active ? `Turn off ${link.label}` : `Turn on ${link.label}`}>
          <Power className="size-3.5" aria-hidden />
          {link.active ? 'Turn off' : 'Turn on'}
        </Button>
      </div>
    </div>
  );
}

function ReviewsScreen() {
  const boot = useBoot();
  const toast = useToast();
  const confirm = useConfirm();
  const state = useOp<LinksResult>('list_review_links');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [modal, setModal] = useState<{ kind: 'new' } | { kind: 'add'; link: ReviewLink } | null>(null);
  // Bumped after a request is added from the modal, so the request list reloads too.
  const [bump, setBump] = useState(0);
  const { reload } = state;

  // ?link=<id> keeps the open link across reloads.
  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get('link'));
    if (id) setSelectedId(id);
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selectedId) url.searchParams.set('link', String(selectedId));
    else url.searchParams.delete('link');
    window.history.replaceState(null, '', url);
  }, [selectedId]);

  async function openAsHost(link: ReviewLink) {
    // Open the tab first (in the click), then point it at the signed link: pop-up blockers allow that.
    const tab = window.open('about:blank', '_blank');
    try {
      const { url } = await callOp<{ url: string }>(boot, 'open_review_as_host', { id: link.id });
      if (tab) tab.location.href = url;
      else window.location.href = url;
    } catch (err) {
      tab?.close();
      toast(err instanceof Error ? err.message : 'Could not open it', { tone: 'bad' });
    }
  }

  async function toggle(link: ReviewLink) {
    if (link.active) {
      const yes = await confirm({
        title: `Turn off ${link.label}?`,
        body: 'The client’s link stops working until you turn it back on. Their requests stay here.',
        confirmLabel: 'Turn off',
        tone: 'danger',
      });
      if (!yes) return;
    }
    try {
      await callOp(boot, 'update_review_link', { id: link.id, active: !link.active });
      toast(link.active ? 'Link turned off' : 'Link turned on');
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not change it', { tone: 'bad' });
    }
  }

  const newButton = (
    <Button variant="primary" onClick={() => setModal({ kind: 'new' })} disabled={state.data ? !state.data.configured : false}>
      <Plus className="size-4" aria-hidden />
      New review link
    </Button>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Site reviews"
        subtitle="Send a client a link to their live site. They click what to change; you push it to Claude."
        actions={newButton}
      />

      <Loaded state={state} skeleton="cards">
        {(data) => {
          if (!data.configured) {
            return (
              <Notice tone="warn" title="The review app isn’t connected">
                Set REVIEW_APP_URL (e.g. https://review.taammarketing.com) and REVIEW_APP_KEY on this server. REVIEW_APP_KEY must match HOST_API_KEY on the review app.
              </Notice>
            );
          }
          const links = data.links;
          const selected = links.find((l) => l.id === selectedId) ?? null;
          const sum = (k: 'new' | 'queued' | 'done') => links.reduce((n, l) => n + (l.counts?.[k] ?? 0), 0);
          if (links.length === 0) {
            return (
              <Card>
                <Empty title="No review links yet" icon={Link2} action={newButton}>
                  Make a link for a client’s website and send it to them. They click the parts they want changed, type what they want, and it lands here.
                </Empty>
              </Card>
            );
          }
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Live links" value={links.filter((l) => l.active).length} icon={Link2} />
                <Stat label="To review" value={sum('new')} tone={sum('new') > 0 ? 'brand' : undefined} hint={sum('new') > 0 ? 'Waiting for you' : 'All caught up'} />
                <Stat label="With Claude" value={sum('queued')} tone={sum('queued') > 0 ? 'warn' : undefined} />
                <Stat label="Done" value={sum('done')} tone="ok" />
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className={`flex w-full items-center gap-2 rounded-control border bg-raised px-3 py-2.5 text-left text-sm font-bold text-ink ${selected ? 'border-line' : 'border-brand'}`}
                  >
                    <Inbox className="size-4" aria-hidden />
                    Every link
                  </button>
                  {links.map((link) => (
                    <LinkRow
                      key={link.id}
                      link={link}
                      active={selected?.id === link.id}
                      onSelect={() => setSelectedId(link.id)}
                      onHost={() => void openAsHost(link)}
                      onToggle={() => void toggle(link)}
                      onAdd={() => setModal({ kind: 'add', link })}
                    />
                  ))}
                </div>
                <Card title={selected ? selected.label : 'Requests from every link'} subtitle={selected ? hostOf(selected.site_url) : 'Newest client changes first land in To review'}>
                  <Requests key={bump} link={selected} onChanged={reload} />
                </Card>
              </div>
            </div>
          );
        }}
      </Loaded>

      {modal?.kind === 'new' && (
        <NewLinkModal
          onClose={() => setModal(null)}
          onCreated={(link) => {
            toast(`${link.label} is ready`);
            setSelectedId(link.id);
            reload();
          }}
        />
      )}
      {modal?.kind === 'add' && (
        <AddRequestModal
          link={modal.link}
          onClose={() => setModal(null)}
          onAdded={() => {
            setModal(null);
            toast('Request added');
            setBump((n) => n + 1);
            reload();
          }}
        />
      )}
    </div>
  );
}

export default function SiteReviewsPage() {
  const boot = useBoot();
  if (!can(boot, PERMISSION)) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Site reviews" />
        <Notice tone="warn" title="Owner and admins only">
          Ask the owner for access to Site reviews.
        </Notice>
      </div>
    );
  }
  return <ReviewsScreen />;
}
