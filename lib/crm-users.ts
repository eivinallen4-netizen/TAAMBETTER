import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import type { Client } from '@libsql/client';

// Team logins (crm_users). The owner's login stays in the env (ADMIN_USERNAME/PASSWORD).

export interface TeamMember {
  id: string;
  name: string;
  username: string;
  role: 'admin' | 'setter';
  active: boolean;
  created_at: string;
}

const USERNAME_RE = /^[a-z0-9._-]{3,40}$/;

function toMember(r: Record<string, unknown>): TeamMember {
  return {
    id: String(r.id),
    name: String(r.name),
    username: String(r.username),
    role: r.role === 'admin' ? 'admin' : 'setter',
    active: Number(r.active) === 1,
    created_at: String(r.created_at),
  };
}

export async function listTeam(db: Client): Promise<TeamMember[]> {
  const result = await db.execute('SELECT id, name, username, role, active, created_at FROM crm_users ORDER BY active DESC, name ASC');
  return result.rows.map((r) => toMember(r as Record<string, unknown>));
}

export async function createTeamMember(
  db: Client,
  input: { name: string; username: string; password: string; role: 'admin' | 'setter' }
): Promise<TeamMember> {
  const username = input.username.trim().toLowerCase();
  if (!input.name.trim()) throw new Error('Add their name');
  if (!USERNAME_RE.test(username)) throw new Error('Username: 3–40 letters, numbers, dots, dashes or underscores');
  if (username === (process.env.ADMIN_USERNAME || '').toLowerCase()) throw new Error('That username is taken');
  if (input.password.length < 8) throw new Error('Password must be at least 8 characters');
  const taken = await db.execute({ sql: 'SELECT 1 FROM crm_users WHERE lower(username) = ?', args: [username] });
  if (taken.rows.length) throw new Error('That username is taken');

  const id = randomUUID();
  const now = new Date().toISOString();
  await db.execute({
    sql: 'INSERT INTO crm_users (id, name, username, password_hash, role, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)',
    args: [id, input.name.trim().slice(0, 80), username, await bcrypt.hash(input.password, 12), input.role, now],
  });
  return { id, name: input.name.trim(), username, role: input.role, active: true, created_at: now };
}

export async function updateTeamMember(
  db: Client,
  id: string,
  changes: { active?: boolean; password?: string; role?: 'admin' | 'setter'; name?: string }
): Promise<void> {
  if (changes.password !== undefined) {
    if (changes.password.length < 8) throw new Error('Password must be at least 8 characters');
    await db.execute({ sql: 'UPDATE crm_users SET password_hash = ? WHERE id = ?', args: [await bcrypt.hash(changes.password, 12), id] });
  }
  if (changes.active !== undefined) {
    await db.execute({ sql: 'UPDATE crm_users SET active = ? WHERE id = ?', args: [changes.active ? 1 : 0, id] });
  }
  if (changes.role) {
    await db.execute({ sql: 'UPDATE crm_users SET role = ? WHERE id = ?', args: [changes.role, id] });
  }
  if (changes.name?.trim()) {
    await db.execute({ sql: 'UPDATE crm_users SET name = ? WHERE id = ?', args: [changes.name.trim().slice(0, 80), id] });
  }
}
