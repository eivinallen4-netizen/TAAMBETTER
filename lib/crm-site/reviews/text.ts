import type { ReviewRequest } from './module';

// Plain-text version of site review requests, grouped by review link. Used by the Site reviews
// screen (Copy / Export .txt) and by the list_all_site_reviews tool, so both read the same.
// No server or browser imports: it runs in both.

const STATUS_LABEL: Record<ReviewRequest['status'], string> = {
  new: 'To review',
  queued: 'Pushed to Claude',
  in_progress: 'In progress',
  done: 'Done',
  wont_do: 'Won’t do',
};

const stamp = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim();
const indent = (s: string) => s.trim().split(/\r?\n/).join('\n  ');

function requestText(r: ReviewRequest): string {
  const version = r.version ? ` · Version ${r.version.number}` : '';
  const lines = [`#${r.id} · ${STATUS_LABEL[r.status] ?? r.status}${version} · ${r.author === 'host' ? 'TAAM' : 'Client'} · ${stamp(r.created_at)}`];
  lines.push(`Page: ${r.page_url || r.page_path}`);
  if (r.element?.text || r.element?.selector) {
    const text = r.element.text ? `“${oneLine(r.element.text).slice(0, 200)}”` : '';
    const sel = r.element.selector ? `(${r.element.selector})` : '';
    lines.push(`Clicked: ${[text, sel].filter(Boolean).join(' ')}`);
  }
  lines.push(`Change: ${indent(r.note)}`);
  if (r.rephrased && r.original_note) lines.push(`Client wrote: ${indent(r.original_note)}`);
  for (const p of r.photos ?? []) lines.push(`Photo: ${p.url} (${p.filename})`);
  if (r.reply) lines.push(`Reply to client: ${indent(r.reply)}`);
  return lines.join('\n');
}

/** Every request as text, one block per review link, in the order given. */
export function reviewRequestsText(requests: ReviewRequest[], opts: { title?: string; now?: Date } = {}): string {
  const groups = new Map<number, ReviewRequest[]>();
  for (const r of requests) groups.set(r.link_id, [...(groups.get(r.link_id) ?? []), r]);
  const head = [
    opts.title ?? 'TAAM site review changes',
    `${requests.length} request${requests.length === 1 ? '' : 's'} · exported ${stamp((opts.now ?? new Date()).toISOString())}`,
  ];
  const blocks = [...groups.values()].map((rs) => {
    const first = rs[0];
    const title = `== ${first.link_label || `Link ${first.link_id}`} ==`;
    const site = first.site_url ? `Site: ${first.site_url}` : '';
    return [title, site, '', rs.map(requestText).join('\n\n')].filter((l, i) => i !== 1 || l).join('\n');
  });
  return [head.join('\n'), ...blocks].join('\n\n\n') + '\n';
}

/** A safe file name for a .txt export, e.g. "site-reviews-wave-homepage-2026-11-20.txt". */
export function reviewsFileName(label: string | null, now = new Date()): string {
  const slug = (label ?? 'all').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'all';
  const day = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  return `site-reviews-${slug}-${day}.txt`;
}
