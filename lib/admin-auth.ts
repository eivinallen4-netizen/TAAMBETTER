import { crm } from '@/crm';

// Sign-in belongs to the CRM (@taam/crm) now: one login, one session cookie. The website's own
// admin routes (SEO pages, slides, free-video-offer leads) ask it who is signed in through
// these helpers, which keep the names the routes already use.

export type CrmRole = 'admin' | 'setter';

export interface AdminSessionData {
  /** 'owner' for the owner's login, otherwise the team member's id. */
  sub: string;
  exp: number;
  role?: CrmRole;
  name?: string;
  /** True for the owner's own login. */
  owner?: boolean;
}

/** Anyone signed in to the CRM. A deactivated team login stops working right away. */
export async function requireStaff(): Promise<AdminSessionData> {
  const actor = await crm.currentActor();
  if (!actor) throw new Error('Unauthorized');
  const manages = actor.role === 'owner' || actor.role === 'admin';
  return { sub: actor.id, exp: 0, role: manages ? 'admin' : 'setter', name: actor.name, owner: actor.role === 'owner' };
}

/** The owner and admins only: the website tools (SEO pages, video-offer leads). */
export async function requireAdmin(): Promise<AdminSessionData> {
  const session = await requireStaff();
  if (session.role !== 'admin') throw new Error('Unauthorized');
  return session;
}

/** The owner only: anything that shows a sales lead, which the CRM keeps private to the owner. */
export async function requireOwner(): Promise<AdminSessionData> {
  const session = await requireStaff();
  if (!session.owner) throw new Error('Unauthorized');
  return session;
}

export function sessionRole(session: AdminSessionData): CrmRole {
  return session.role ?? 'admin';
}
