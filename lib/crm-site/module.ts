import { z } from 'zod';
import { defineModule, defineOp, OpError, type OpContext, type Operation } from '@taam/crm/server';
import { OPERATIONS as WEBSITE_OPERATIONS, OpError as WebsiteOpError, type Operation as WebsiteOperation } from '@/lib/crm/operations';
import { initActivityTable, logActivity } from '@/lib/activity-log';
import { initPagesTables } from '@/lib/pages/store';
import { deckMigrations } from './decks';
import { sendOperations } from './send';

// The parts of the admin that belong to the TAAM website, not to the CRM product: the SEO pages
// editor, the slides and the free-video-offer sign-ups. They plug into the CRM as one module, so
// they sit in the same menu and Claude reaches them on the same API and MCP endpoint as before.
// The screens themselves are ordinary pages under app/admin (pages, website-deck, decks,
// video-offers, contacts/[id]/deck), framed by the CRM's menu.

const PERMISSION = 'site:manage';

type JsonSchema = Record<string, unknown>;

/** The website operations describe their input as JSON Schema; the CRM wants zod. */
function toZod(schema: JsonSchema, key = ''): z.ZodType {
  // "A JSON string or object": take either.
  if (key === 'schema_jsonld') return z.union([z.string(), z.record(z.string(), z.any())]).describe(String(schema.description ?? ''));
  let out: z.ZodType;
  if (Array.isArray(schema.enum) && schema.enum.length) out = z.enum(schema.enum.map(String) as [string, ...string[]]);
  else if (schema.type === 'integer') out = z.number().int();
  else if (schema.type === 'number') out = z.number();
  else if (schema.type === 'boolean') out = z.boolean();
  else if (schema.type === 'array') out = z.array(schema.items ? toZod(schema.items as JsonSchema) : z.any());
  else if (schema.type === 'object') out = objectToZod(schema);
  else out = z.string();
  return typeof schema.description === 'string' ? out.describe(schema.description) : out;
}

function objectToZod(schema: JsonSchema): z.ZodType {
  const properties = (schema.properties ?? {}) as Record<string, JsonSchema>;
  const required = new Set((schema.required as string[] | undefined) ?? []);
  const shape: Record<string, z.ZodType> = {};
  for (const [key, value] of Object.entries(properties)) {
    const field = toZod(value, key);
    shape[key] = required.has(key) ? field : field.optional();
  }
  return z.object(shape);
}

/** What a call was about, for the page activity log. */
function activityTarget(args: Record<string, unknown>): string {
  for (const k of ['slug', 'id', 'email', 'name', 'business_name']) if (typeof args[k] === 'string' && args[k]) return String(args[k]);
  return '';
}

let tablesReady: Promise<void> | null = null;
/** The website's own tables (pages, revisions, the page activity log). Made once per server process. */
function ensureWebsiteTables(ctx: OpContext): Promise<void> {
  tablesReady ??= Promise.all([initPagesTables(ctx.db), initActivityTable(ctx.db)]).then(
    () => undefined,
    (error) => {
      tablesReady = null;
      throw error;
    }
  );
  return tablesReady;
}

/** Runs one of the website's own operations as a CRM operation: same name, same input, same result. */
function fromWebsite(name: string, overrides: Partial<Pick<Operation, 'path' | 'description'>> = {}): Operation {
  const source = WEBSITE_OPERATIONS.find((op) => op.name === name) as WebsiteOperation | undefined;
  if (!source) throw new Error(`Website operation "${name}" is missing from lib/crm/operations.ts`);
  return defineOp({
    name: source.name,
    description: overrides.description ?? source.description,
    method: source.method,
    path: overrides.path ?? source.path,
    permission: PERMISSION,
    readOnly: source.readOnly,
    input: objectToZod(source.input) as z.ZodType<Record<string, unknown>>,
    run: async (input, ctx) => {
      await ensureWebsiteTables(ctx);
      const args = input as Record<string, unknown>;
      // The page editor's own history (/admin/pages/activity) reads this log, so changes made
      // through the API or Claude keep showing up there.
      const log = (ok: boolean, error?: string) =>
        source.readOnly
          ? Promise.resolve()
          : logActivity(ctx.db, { source: ctx.actor.type === 'apikey' ? 'mcp' : 'admin', actor: ctx.actor.name, action: source.name, target: activityTarget(args), detail: args, ok, error });
      try {
        const result = await source.run(args, { db: ctx.db, origin: ctx.origin, actor: { id: ctx.actor.id, name: ctx.actor.name } });
        await log(true);
        return result;
      } catch (error) {
        if (error instanceof WebsiteOpError) {
          await log(false, error.message);
          throw new OpError(error.status, error.message);
        }
        await log(false, 'Internal error');
        throw error;
      }
    },
  });
}

// ---------- The contact operations, under the names Claude and older scripts already use ----------
// Contacts are leads in the new CRM. These pass straight through to the lead operations, so
// there is one set of rules; they only translate the old field names and result shapes.

async function callCrm(name: string, input: unknown, ctx: OpContext): Promise<Record<string, unknown>> {
  const { crm } = await import('@/crm');
  return (await crm.call(name, input, ctx)) as Record<string, unknown>;
}

const zContactId = z.object({ id: z.string().min(1).describe('Contact id') });

const contactFields = {
  name: z.string().optional().describe('Full name'),
  email: z.string().optional().describe('Email address'),
  phone: z.string().optional().describe('Phone number'),
  business_name: z.string().optional().describe('Business name'),
  website: z.string().optional().describe('Business website URL'),
  social_url: z.string().optional().describe('Social media profile URL'),
  gbp_url: z.string().optional().describe('Google Business Profile URL'),
  message: z.string().optional().describe('Notes / message'),
  industry: z.string().optional().describe('Industry'),
  budget: z.string().optional().describe('Monthly marketing budget'),
  timeline: z.string().optional().describe('When they want to start'),
  role: z.string().optional().describe('Their role at the business'),
  business_stage: z.string().optional().describe('Business stage'),
  biggest_challenge: z.string().optional().describe('Their biggest marketing challenge'),
  services_interested: z.string().optional().describe('Services they asked about'),
  interests: z.string().optional().describe('Comma list of interests: website, video, social, ads, seo, branding'),
  source_page: z.string().optional().describe('Where they came from'),
};

/** Drops blanks and splits a full name, so only what was sent reaches the lead operation. */
function leadInput(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    out[key] = typeof value === 'string' ? value.trim() : value;
  }
  return out;
}

const contactOperations: Operation[] = [
  defineOp({
    name: 'search_contacts',
    description: 'List or search contacts (the sales leads), most recently changed first. Search matches name, email, business, phone and website. Same as list_leads. Returns { total, limit, offset, data }.',
    method: 'GET',
    path: '/contacts',
    permission: PERMISSION,
    readOnly: true,
    input: z.object({
      search: z.string().optional().describe('Text to search for'),
      filter: z.enum(['strong']).optional().describe('Quick filter: "strong" is strong-fit leads only'),
      limit: z.number().int().min(1).max(200).optional().describe('Max rows (default 50)'),
      offset: z.number().int().min(0).optional().describe('Rows to skip'),
    }),
    run: async (input, ctx) => {
      const limit = input.limit ?? 50;
      const offset = input.offset ?? 0;
      const found = await callCrm('list_leads', { search: input.search || undefined, fit: input.filter === 'strong' ? 'strong' : undefined, limit, offset }, ctx);
      return { total: found.total, limit, offset, data: found.leads };
    },
  }),
  defineOp({
    name: 'get_contact',
    description: 'One contact with everything on file, plus their appointment links and onboardings. Same as get_lead.',
    method: 'GET',
    path: '/contacts/{id}',
    permission: PERMISSION,
    readOnly: true,
    input: zContactId,
    run: async ({ id }, ctx) => {
      const found = await callCrm('get_lead', { id }, ctx);
      return { ...(found.lead as Record<string, unknown>), appointment_links: found.appointment_links, onboardings: found.onboardings };
    },
  }),
  defineOp({
    name: 'create_contact',
    description: 'Add a contact (a sales lead). If the email already exists, the details merge into that contact instead of making a duplicate. Same as save_lead. Returns { id, created }.',
    method: 'POST',
    path: '/contacts',
    permission: PERMISSION,
    input: z.object(contactFields),
    run: async (input, ctx) => {
      const saved = await callCrm('save_lead', leadInput({ ...input, source: 'API', source_page: input.source_page || `Added by ${ctx.actor.name}` }), ctx);
      return { id: (saved.lead as { id: string }).id, created: saved.created };
    },
  }),
  defineOp({
    name: 'update_contact',
    description: 'Change fields on a contact. Only the fields you send are changed. Same as update_lead.',
    method: 'PATCH',
    path: '/contacts/{id}',
    permission: PERMISSION,
    input: z.object({ ...zContactId.shape, ...contactFields }),
    run: async ({ id, name, ...rest }, ctx) => {
      const patch = leadInput(rest);
      if (name !== undefined) {
        const parts = name.trim().split(/\s+/);
        patch.first_name = parts[0] ?? '';
        patch.last_name = parts.slice(1).join(' ');
      }
      if (!Object.keys(patch).length) throw new OpError(400, 'Send at least one field to change');
      const updated = await callCrm('update_lead', { id, ...patch }, ctx);
      return updated.lead;
    },
  }),
  defineOp({
    name: 'delete_contact',
    description: 'Archive a contact: it leaves the pipeline and every list, and can be restored from the clients screen. Nothing is erased.',
    method: 'DELETE',
    path: '/contacts/{id}',
    permission: PERMISSION,
    input: zContactId,
    run: async ({ id }, ctx) => {
      await callCrm('archive_client', { id }, ctx);
      return { archived: true };
    },
  }),
  defineOp({
    name: 'get_overview',
    description: 'Pipeline snapshot: leads added this week, open leads, strong-fit leads still open and call-list follow-ups due. Same as get_sales_overview.',
    method: 'GET',
    path: '/overview',
    permission: PERMISSION,
    readOnly: true,
    input: z.object({}),
    run: async (_input, ctx) => callCrm('get_sales_overview', {}, ctx),
  }),
];

export const taamSiteModule = defineModule({
  id: 'taam-site',
  label: 'TAAM website',
  description: 'SEO pages, slides and free-video-offer sign-ups for the TAAM website.',
  // Owner and admins only (they hold every permission); no other role gets the website tools.
  permissions: { [PERMISSION]: [] },
  migrations: deckMigrations,
  nav: [
    { group: 'Website', label: 'SEO pages', href: '/pages', icon: 'FileText', permission: PERMISSION, order: 300 },
    { group: 'Website', label: 'Website slides', href: '/website-deck', icon: 'Presentation', permission: PERMISSION, order: 310 },
    { group: 'Website', label: 'Client slides', href: '/decks', icon: 'Presentation', permission: PERMISSION, order: 320 },
    { group: 'Website', label: 'Free video offers', href: '/video-offers', icon: 'Video', permission: PERMISSION, order: 330 },
  ],
  operations: [
    fromWebsite('list_pages'),
    fromWebsite('get_page'),
    fromWebsite('create_page'),
    fromWebsite('update_page'),
    fromWebsite('publish_page'),
    fromWebsite('unpublish_page'),
    // /leads is the sales pipeline in the new CRM; the sign-ups moved to their own path.
    fromWebsite('list_video_offer_leads', { path: '/video-offer-leads' }),
    ...contactOperations,
    ...sendOperations(PERMISSION),
  ],
});
