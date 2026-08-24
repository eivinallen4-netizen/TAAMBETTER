import { randomBytes } from 'crypto';
import client from './db';

const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

export async function sendVerificationEmail(userId: string, email: string): Promise<string> {
  const token = generateVerificationToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY).toISOString();

  await client.execute({
    sql: 'UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?',
    args: [token, expiresAt, userId],
  });

  // In production, send actual email
  // For now, log the token (developer can check logs)
  console.log(`Verification email sent to ${email}. Token: ${token}`);
  console.log(`Verification link: ${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/verify?token=${token}`);

  return token;
}

export async function verifyEmail(token: string): Promise<boolean> {
  const result = await client.execute({
    sql: `
      SELECT id FROM users
      WHERE verification_token = ?
      AND verification_token_expires > ?
      AND email_verified = false
    `,
    args: [token, new Date().toISOString()],
  });

  if (result.rows.length === 0) {
    return false;
  }

  const userId = (result.rows[0] as any).id;

  await client.execute({
    sql: `
      UPDATE users
      SET email_verified = true, verification_token = NULL, verification_token_expires = NULL
      WHERE id = ?
    `,
    args: [userId],
  });

  return true;
}

export async function isEmailVerified(userId: string): Promise<boolean> {
  const result = await client.execute({
    sql: 'SELECT email_verified FROM users WHERE id = ?',
    args: [userId],
  });

  if (result.rows.length === 0) return false;
  return (result.rows[0] as any).email_verified === true;
}
