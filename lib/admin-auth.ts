import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

const ADMIN_COOKIE = 'admin_session';
const SESSION_DURATION = 12 * 60 * 60 * 1000; // 12 hours

interface AdminSessionData {
  sub: string;
  exp: number;
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

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    throw new Error('Admin credentials not configured');
  }

  const userMatch = timingSafeEqual(Buffer.from(username), Buffer.from(expectedUsername));
  const passMatch = timingSafeEqual(Buffer.from(password), Buffer.from(expectedPassword));

  return userMatch && passMatch;
}

export async function createAdminSession(): Promise<void> {
  const payload: AdminSessionData = {
    sub: 'admin',
    exp: Date.now() + SESSION_DURATION,
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

export async function requireAdmin(): Promise<AdminSessionData> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
