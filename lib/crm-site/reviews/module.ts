import { z } from 'zod';
import { defineModule, defineOp } from '@taam/crm/server';
import { reviewApi, reviewsConfig } from './remote';

// Site reviews: TAAM makes a review link for a client's website and sends it to them. The
// client opens it, clicks the things they want changed on their live site, and sends notes.
// Here the team sees every request, rephrases it if needed (the client's own words are kept),
// adds its own, and pushes them to Claude. Claude works through the pushed ("queued") ones with
// list_review_requests and update_review_requests, and its reply shows on the client's link.
// The data lives in the review app (see remote.ts). The screen is app/admin/reviews/page.tsx.

const PERMISSION = 'reviews:manage';
const STATUSES = ['new', 'queued', 'in_progress', 'done', 'wont_do'] as const;

export interface ReviewLink {
  id: number;
  label: string;
  client_name: string | null;
  site_url: string;
  share_url: string;
  active: boolean;
  created_at: string;
  counts: { new: number; queued: number; in_progress: number; done: number; wont_do: number; total: number } | null;
}

export interface ReviewRequest {
  id: number;
  link_id: number;
  link_label: string | null;
  site_url: string | null;
  author: 'client' | 'host';
  status: (typeof STATUSES)[number];
  page_path: string;
  page_url: string | null;
  note: string;
  original_note: string;
  rephrased: boolean;
  element: { selector: string | null; text: string | null; html: string | null } | null;
  reply: string | null;
  /** Photos the client attached (e.g. a new team photo to put on the page). `url` downloads the original. */
  photos: { id: string; url: string; filename: string; mime: string; size: number; width: number | null; height: number | null }[];
  created_at: string;
  updated_at: string;
}

const zLinkId = z.number().int().positive().describe('Review link id');
const zRequestId = z.number().int().positive().describe('Review request id');
const zStatus = z.enum(STATUSES);

const operations = [
  defineOp({
    name: 'list_review_links',
    description:
      'Every site review link: the client site, the share link to send the client, whether it is on, and how many requests it has by status (new = sent by the client and waiting for TAAM, queued = pushed to Claude, in_progress, done, wont_do).',
    method: 'GET',
    path: '/reviews/links',
    permission: PERMISSION,
    readOnly: true,
    input: z.object({}),
    run: async () => {
      const cfg = reviewsConfig();
      if (!cfg) return { configured: false, review_app_url: null, links: [] as ReviewLink[] };
      const { links } = await reviewApi<{ links: ReviewLink[] }>('GET', '/links');
      return { configured: true, review_app_url: cfg.url, links };
    },
  }),
  defineOp({
    name: 'create_review_link',
    description:
      "Make a site review link for a client's website. Returns { link } with share_url: send that to the client. They open it, click what they want changed on their live site and send notes.",
    method: 'POST',
    path: '/reviews/links',
    permission: PERMISSION,
    openWorld: true,
    input: z.object({
      site_url: z.string().trim().min(3).max(500).describe('The client website, e.g. https://clientsite.com (may include the page to start on)'),
      label: z.string().trim().max(160).optional().describe("Name for this review round, e.g. 'Wave homepage round 2'"),
      client_name: z.string().trim().max(160).optional().describe('Client or contact name, shown on their review page'),
    }),
    run: async (input) =>
      reviewApi<{ link: ReviewLink }>('POST', '/links', { target_url: input.site_url, label: input.label ?? '', client_name: input.client_name || null }),
  }),
  defineOp({
    name: 'update_review_link',
    description: 'Rename a review link, change its client name, or turn it off/on (active). A link that is off stops working for the client. Returns { link }.',
    method: 'PATCH',
    path: '/reviews/links/{id}',
    permission: PERMISSION,
    openWorld: true,
    input: z.object({ id: zLinkId, label: z.string().trim().max(160).optional(), client_name: z.string().trim().max(160).optional(), active: z.boolean().optional() }),
    run: async ({ id, ...patch }) => reviewApi<{ link: ReviewLink }>('PATCH', `/links/${id}`, patch),
  }),
  defineOp({
    name: 'open_review_as_host',
    description:
      'A one-time sign-in link (valid 5 minutes) that opens a review link as TAAM: anything added there is marked as TAAM\'s own and hidden from the client. For people in the admin; not something to send a client.',
    method: 'POST',
    path: '/reviews/links/{id}/host-url',
    permission: PERMISSION,
    openWorld: true,
    input: z.object({ id: zLinkId }),
    run: async ({ id }) => reviewApi<{ url: string; expires_at: string }>('POST', `/links/${id}/host-url`, {}),
  }),
  defineOp({
    name: 'list_review_requests',
    description:
      'Change requests from site reviews. Defaults to status "queued": only what TAAM reviewed and pushed to Claude. Each one has `note` (the instruction to carry out, possibly rephrased by TAAM), `original_note` (the client\'s own words), the page (page_url) and the exact element clicked (CSS selector, visible text, HTML snippet) so it can be found in the site\'s source, and `photos` the client attached (download each `url` into the site\'s images when the note asks for it; add ?download=1 to save with its filename). ' +
      'Workflow for Claude: set a request to in_progress when starting, make the change in the site\'s code, then update_review_requests with status done and a one-sentence plain-language reply for the client (or wont_do with the reason).',
    method: 'GET',
    path: '/reviews/requests',
    permission: PERMISSION,
    readOnly: true,
    input: z.object({
      status: z.enum([...STATUSES, 'all']).optional().describe('Default "queued". Use "all" for everything.'),
      link_id: zLinkId.optional().describe('Only this review link'),
      limit: z.number().int().min(1).max(500).optional(),
    }),
    run: async ({ status, link_id, limit }) => {
      const q = new URLSearchParams({ status: status ?? 'queued' });
      if (link_id) q.set('link_id', String(link_id));
      if (limit) q.set('limit', String(limit));
      return reviewApi<{ requests: ReviewRequest[] }>('GET', `/requests?${q}`);
    },
  }),
  defineOp({
    name: 'get_review_request',
    description: 'One site review request with its full element details. Returns { request }.',
    method: 'GET',
    path: '/reviews/requests/{id}',
    permission: PERMISSION,
    readOnly: true,
    input: z.object({ id: zRequestId }),
    run: async ({ id }) => reviewApi<{ request: ReviewRequest }>('GET', `/requests/${id}`),
  }),
  defineOp({
    name: 'update_review_requests',
    description:
      'Change one or more site review requests: status (new, queued = push to Claude, in_progress, done, wont_do), note (rephrase the instruction; the client\'s original words are kept), and/or reply (shown to the client on their review link). Returns { changed, requests }.',
    method: 'PATCH',
    path: '/reviews/requests',
    permission: PERMISSION,
    openWorld: true,
    input: z.object({
      ids: z.array(zRequestId).min(1).max(500),
      status: zStatus.optional(),
      note: z.string().trim().min(1).max(4000).optional(),
      reply: z.string().max(2000).optional().describe('Shown to the client, e.g. "Changed the headline to …". Send "" to clear it.'),
    }),
    run: async (input) => reviewApi<{ changed: number; requests: ReviewRequest[] }>('PATCH', '/requests', input),
  }),
  defineOp({
    name: 'add_review_request',
    description:
      "Add TAAM's own change request to a review link (the client won't see it). With push true it goes straight to Claude (queued). Returns { request }.",
    method: 'POST',
    path: '/reviews/requests',
    permission: PERMISSION,
    openWorld: true,
    input: z.object({
      link_id: zLinkId,
      note: z.string().trim().min(1).max(4000).describe('What should change'),
      page_path: z.string().trim().max(500).optional().describe('Page on the site, e.g. /about. Default /'),
      push: z.boolean().optional().describe('Push straight to Claude'),
    }),
    run: async (input) => reviewApi<{ request: ReviewRequest }>('POST', '/requests', input),
  }),
  defineOp({
    name: 'delete_review_request',
    description: 'Delete a site review request for good. Ask before doing this.',
    method: 'DELETE',
    path: '/reviews/requests/{id}',
    permission: PERMISSION,
    openWorld: true,
    input: z.object({ id: zRequestId }),
    run: async ({ id }) => reviewApi<{ removed: boolean }>('DELETE', `/requests/${id}`),
  }),
];

export const taamReviewsModule = defineModule({
  id: 'taam-reviews',
  label: 'Site reviews',
  description: 'Review links for client websites: clients click what to change on their live site, the team pushes the requests to Claude.',
  // Owner and admins (they hold every permission); no other role.
  permissions: { [PERMISSION]: [] },
  nav: [{ group: 'Website', label: 'Site reviews', href: '/reviews', icon: 'PenLine', permission: PERMISSION, order: 340 }],
  operations,
});
