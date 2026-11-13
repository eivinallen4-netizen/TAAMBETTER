import { crm } from '@/crm';

// Addresses that existed before the CRM moved into @taam/crm (/api/v1, /api/mcp, the Calendly
// webhook) keep working: each old route hands the request to the CRM under its new path.

type Params = Record<string, string | string[] | undefined>;
type Handler = (request: Request, context: { params: Promise<Params> }) => Promise<Response>;

/** A route handler that forwards to the CRM. `toPath` turns this route's params into the CRM path. */
export function forwardToCrm(toPath: (params: Params) => string[]): Record<'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', Handler> {
  const handle: Handler = async (request, context) => {
    const path = toPath(await context.params);
    return crm.handlers[request.method as 'GET'](request, { params: Promise.resolve({ path }) });
  };
  return { GET: handle, POST: handle, PATCH: handle, PUT: handle, DELETE: handle };
}

// REST paths that were renamed in the new CRM. Older scripts (the lead finder) still call the
// names on the left.
const RENAMED: Record<string, string> = {
  appointments: 'appointment-links',
  onboarding: 'onboardings',
  'coldcall-leads': 'call-list',
};

export function legacyRestPath(path: string[]): string[] {
  const [first, ...rest] = path;
  return first && RENAMED[first] ? [RENAMED[first], ...rest] : path;
}
