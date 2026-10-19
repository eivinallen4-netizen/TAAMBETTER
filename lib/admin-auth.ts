import { cookies } from 'next/headers';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import bcrypt from 'bcrypt';
import { getAdminDb } from './admin-db';
import { initializeTables } from './init-tables';

const ADMIN_COOKIE = 'admin_session';
const SESSION_DURATION = 12 * 60 * 60 * 1000; // 12 hours

export type CrmRole = 'admin' | 'setter';

export interface AdminSessionData {
  /** 'admin' for the owner's env login, otherwise the crm_users id. */
  sub: string;
  exp: number;
  /** Sessions made before team logins existed have no role: they were the owner. */
  role?: CrmRole;
  name?: string;
}

export interface CrmUser {
  id: string;
  name: string;
  role: CrmRole;
}

function getSecret(): Buffer {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be at least 32 characters');
  }
  return Buffer.from(secret);
}

function signSession(payload: AdminSessionData): string {
  const secret = getSecret();
  const data = JSON.stringify(payload);
  const signature = createHmac('sha256', secret).update(data).digest('hex');
  return `${data}.${signature}`;
}

function verifySessionSignature(token: string): AdminSessionData | null {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;

    const secret = getSecret();
    const expectedSignature = createHmac('sha256', secret).update(data).digest('hex');

    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(data) as AdminSessionData;
    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/** Constant-time compare that doesn't throw on different lengths. */
function sameText(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** The owner's env login first, then active team logins (crm_users). Null when nothing matches. */
export async function verifyCredentials(username: string, password: string): Promise<CrmUser | null> {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    throw new Error('Admin credentials not configured');
  }

  const userMatch = sameText(username, expectedUsername);
  const passMatch = sameText(password, expectedPassword);
  if (userMatch && passMatch) return { id: 'admin', name: 'Admin', role: 'admin' };

  const db = getAdminDb();
  await initializeTables(db);
  const found = await db.execute({
    sql: 'SELECT id, name, role, password_hash FROM crm_users WHERE lower(username) = lower(?) AND active = 1',
    args: [username.trim()],
  });
  const row = found.rows[0];
  if (!row || !(await bcrypt.compare(password, String(row.password_hash)))) return null;
  return { id: String(row.id), name: String(row.name), role: row.role === 'admin' ? 'admin' : 'setter' };
}

export async function createAdminSession(user: CrmUser): Promise<void> {
  const payload: AdminSessionData = {
    sub: user.id,
    exp: Date.now() + SESSION_DURATION,
    role: user.role,
    name: user.name,
  };

  const token = signSession(payload);
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
  });
}

export async function getAdminSession(): Promise<AdminSessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  return verifySessionSignature(sessionCookie.value);
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export function sessionRole(session: AdminSessionData): CrmRole {
  return session.role ?? 'admin';
}

/** Owner and admin team logins only. Setters are turned away from everything except appointments. */
export async function requireAdmin(): Promise<AdminSessionData> {
  const session = await requireStaff();
  if (sessionRole(session) !== 'admin') {
    throw new Error('Unauthorized');
  }
  return session;
}

/** Anyone on the team, setters included. A deactivated team login stops working right away. */
export async function requireStaff(): Promise<AdminSessionData> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  if (session.sub !== 'admin') {
    const db = getAdminDb();
    await initializeTables(db);
    const found = await db.execute({ sql: 'SELECT active, role, name FROM crm_users WHERE id = ?', args: [session.sub] });
    const row = found.rows[0];
    if (!row || Number(row.active) !== 1) throw new Error('Unauthorized');
    // Role changes take effect right away, not at the next login.
    return { ...session, role: row.role === 'admin' ? 'admin' : 'setter', name: String(row.name) };
  }
  return session;
}
