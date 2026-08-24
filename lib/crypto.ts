import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const SALT_ROUNDS = 12;

interface HashResult {
  hash: string;
  salt: string;
}

export async function hashWithSalt(data: string): Promise<HashResult> {
  const salt = randomBytes(16).toString('hex');
  const hash = await bcrypt.hash(`${data}:${salt}`, SALT_ROUNDS);
  return { hash, salt };
}

export async function verifyHash(data: string, hash: string, salt: string): Promise<boolean> {
  return bcrypt.compare(`${data}:${salt}`, hash);
}

export async function hashCredential(
  username: string,
  email: string,
  password: string
): Promise<{
  username: HashResult;
  email: HashResult;
  password: HashResult;
}> {
  const [usernameResult, emailResult, passwordResult] = await Promise.all([
    hashWithSalt(username),
    hashWithSalt(email),
    hashWithSalt(password),
  ]);

  return {
    username: usernameResult,
    email: emailResult,
    password: passwordResult,
  };
}
