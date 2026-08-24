import { cookies } from 'next/headers';
import client from './db';
import { User } from './types';
import { randomUUID } from 'crypto';

const SESSION_COOKIE = 'user_session';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

interface SessionData {
  userId: string;
  email: string;
  expiresAt: number;
}

export async function createOrGetUser(email: string, name?: string): Promise<User> {
  // Try to find existing user
  const existingResult = await client.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [email],
  });

  if (existingResult.rows.length > 0) {
    const row = existingResult.rows[0] as any;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      email_verified: row.email_verified,
      verification_token: row.verification_token,
      verification_token_expires: row.verification_token_expires,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  // Create new user
  const userId = randomUUID();
  const now = new Date().toISOString();

  await client.execute({
    sql: `INSERT INTO users (id, email, name, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [userId, email, name || null, false, now, now],
  });

  return {
    id: userId,
    email,
    name: name || null,
    email_verified: false,
    verification_token: null,
    verification_token_expires: null,
    created_at: now,
    updated_at: now,
  };
}

export async function createSession(email: string, name?: string): Promise<string> {
  const user = await createOrGetUser(email, name);

  const sessionData: SessionData = {
    userId: user.id,
    email: user.email,
    expiresAt: Date.now() + SESSION_DURATION,
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
  });

  return user.id;
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  try {
    const sessionData = JSON.parse(sessionCookie.value) as SessionData;

    if (sessionData.expiresAt < Date.now()) {
      cookieStore.delete(SESSION_COOKIE);
      return null;
    }

    return sessionData;
  } catch {
    return null;
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.userId || null;
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
