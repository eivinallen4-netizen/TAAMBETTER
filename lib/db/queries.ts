import client from '../db';
import { SocialMediaAccount, SocialMediaAccountInput } from '../types';
import { hashCredential } from '../crypto';
import { randomUUID } from 'crypto';

export async function saveSocialMediaAccount(
  userId: string,
  account: SocialMediaAccountInput
): Promise<SocialMediaAccount> {
  const { username, email, password, platform } = account;

  const hashed = await hashCredential(username, email, password);

  const id = randomUUID();
  const now = new Date().toISOString();

  const result = await client.execute({
    sql: `
      INSERT INTO social_media_accounts (
        id, user_id, platform,
        username_hash, username_salt,
        email_hash, email_salt,
        password_hash, password_salt,
        is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      id,
      userId,
      platform,
      hashed.username.hash,
      hashed.username.salt,
      hashed.email.hash,
      hashed.email.salt,
      hashed.password.hash,
      hashed.password.salt,
      true,
      now,
      now,
    ],
  });

  return {
    id,
    user_id: userId,
    platform,
    username_hash: hashed.username.hash,
    username_salt: hashed.username.salt,
    email_hash: hashed.email.hash,
    email_salt: hashed.email.salt,
    password_hash: hashed.password.hash,
    password_salt: hashed.password.salt,
    is_active: true,
    created_at: now,
    updated_at: now,
  };
}

export async function getSocialMediaAccounts(userId: string): Promise<SocialMediaAccount[]> {
  const result = await client.execute({
    sql: 'SELECT * FROM social_media_accounts WHERE user_id = ? AND is_active = true',
    args: [userId],
  });

  return result.rows.map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    platform: row.platform,
    username_hash: row.username_hash,
    username_salt: row.username_salt,
    email_hash: row.email_hash,
    email_salt: row.email_salt,
    password_hash: row.password_hash,
    password_salt: row.password_salt,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function deleteSocialMediaAccount(accountId: string, userId: string): Promise<void> {
  await client.execute({
    sql: 'UPDATE social_media_accounts SET is_active = false, updated_at = ? WHERE id = ? AND user_id = ?',
    args: [new Date().toISOString(), accountId, userId],
  });
}

export async function getSocialMediaAccount(
  accountId: string,
  userId: string
): Promise<SocialMediaAccount | null> {
  const result = await client.execute({
    sql: 'SELECT * FROM social_media_accounts WHERE id = ? AND user_id = ? AND is_active = true',
    args: [accountId, userId],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0] as any;
  return {
    id: row.id,
    user_id: row.user_id,
    platform: row.platform,
    username_hash: row.username_hash,
    username_salt: row.username_salt,
    email_hash: row.email_hash,
    email_salt: row.email_salt,
    password_hash: row.password_hash,
    password_salt: row.password_salt,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
