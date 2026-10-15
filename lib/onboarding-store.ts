import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import type { Client } from '@libsql/client';
import { normalizeAnswers, toKind, type OnboardingAnswers, type OnboardingKind, type OnboardingStatus, type PasswordMap } from '@/app/lib/onboarding';

// Client logins have to be readable by the team later, so they are encrypted (AES-256-GCM),
// not hashed. The key lives only in ONBOARDING_ENCRYPTION_KEY; lose it and saved passwords are gone.

function getKey(): Buffer {
  const secret = process.env.ONBOARDING_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error('ONBOARDING_ENCRYPTION_KEY must be set (at least 32 characters)');
  }
  return createHash('sha256').update(`taam-onboarding:${secret}`).digest();
}

export function encryptPasswords(passwords: PasswordMap): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(passwords), 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), body.toString('base64')].join(':');
}

export function decryptPasswords(blob: string | null | undefined): PasswordMap {
  if (!blob) return {};
  const [version, iv, tag, body] = blob.split(':');
  if (version !== 'v1' || !iv || !tag || !body) return {};
  const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  const json = Buffer.concat([decipher.update(Buffer.from(body, 'base64')), decipher.final()]).toString('utf8');
  return JSON.parse(json) as PasswordMap;
}

export function newOnboardingToken(): string {
  return randomBytes(24).toString('base64url');
}

export interface OnboardingRow {
  id: string;
  token: string;
  kind: OnboardingKind;
  client_name: string;
  business_name: string;
  client_email: string;
  message: string;
  status: OnboardingStatus;
  current_step: number;
  answers: OnboardingAnswers;
  credentials: string | null;
  admin_notes: string;
  created_at: string;
  updated_at: string;
  opened_at: string | null;
  submitted_at: string | null;
}

export function toOnboardingRow(row: Record<string, unknown>): OnboardingRow {
  let parsed: unknown = null;
  try {
    parsed = row.answers ? JSON.parse(String(row.answers)) : null;
  } catch {
    parsed = null;
  }
  const s = (v: unknown) => (v == null ? '' : String(v));
  return {
    id: s(row.id),
    token: s(row.token),
    kind: toKind(row.kind),
    client_name: s(row.client_name),
    business_name: s(row.business_name),
    client_email: s(row.client_email),
    message: s(row.message),
    status: (s(row.status) || 'sent') as OnboardingStatus,
    current_step: Number(row.current_step ?? 0),
    answers: normalizeAnswers(parsed, {
      businessName: s(row.business_name),
      contactName: s(row.client_name),
      email: s(row.client_email),
    }),
    credentials: row.credentials == null ? null : String(row.credentials),
    admin_notes: s(row.admin_notes),
    created_at: s(row.created_at),
    updated_at: s(row.updated_at),
    opened_at: row.opened_at == null ? null : String(row.opened_at),
    submitted_at: row.submitted_at == null ? null : String(row.submitted_at),
  };
}

export async function getOnboardingByToken(db: Client, token: string): Promise<OnboardingRow | null> {
  const result = await db.execute({ sql: 'SELECT * FROM client_onboardings WHERE token = ?', args: [token] });
  return result.rows[0] ? toOnboardingRow(result.rows[0] as Record<string, unknown>) : null;
}

export async function getOnboardingById(db: Client, id: string): Promise<OnboardingRow | null> {
  const result = await db.execute({ sql: 'SELECT * FROM client_onboardings WHERE id = ?', args: [id] });
  return result.rows[0] ? toOnboardingRow(result.rows[0] as Record<string, unknown>) : null;
}

export function onboardingUrl(token: string, origin?: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || origin || 'https://taammarketing.com';
  return `${base.replace(/\/$/, '')}/onboarding/${token}`;
}
