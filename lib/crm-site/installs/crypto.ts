import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { OpError } from '@taam/crm/server';

// The API keys of the client CRM installs, kept so the TAAM CRM can read each install's summary.
// They have to be read back (to call the install), so they cannot be hashed: each one is stored as
// an AES-256-GCM blob under a key derived from CRM_INSTALLS_KEY, with the install id as the
// additional data, so a blob copied onto another row does not decrypt. The plain key never leaves
// the server: screens and the API only ever see `key_hint` (its last 4 characters).
// Same scheme as the CRM's onboarding logins (packages/crm/src/modules/agency/onboarding.ts).

const MIN_SECRET = 32;

function secret(): string {
  const value = process.env.CRM_INSTALLS_KEY ?? '';
  return value.length >= MIN_SECRET ? value : '';
}

/** True when CRM_INSTALLS_KEY is set (at least 32 characters). */
export function installsKeyConfigured(): boolean {
  return Boolean(secret());
}

/** 503 when the server has no CRM_INSTALLS_KEY, so nothing is ever stored unencrypted. */
export function requireInstallsKey(): void {
  if (!secret()) {
    throw new OpError(503, 'CRM_INSTALLS_KEY is not set on this server (it needs at least 32 characters), so client install keys cannot be stored or read.');
  }
}

function cipherKey(): Buffer {
  requireInstallsKey();
  return createHash('sha256').update(`taam-installs:${secret()}`).digest();
}

/** Encrypts an install's API key. `installId` is bound in as additional data. */
export function encryptKey(installId: string, apiKey: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', cipherKey(), iv);
  cipher.setAAD(Buffer.from(installId, 'utf8'));
  const body = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), body.toString('base64')].join(':');
}

/** Throws when the blob was written with a different key, for another install, or was tampered with. */
export function decryptKey(installId: string, blob: string): string {
  const [version, iv, tag, body] = String(blob || '').split(':');
  if (version !== 'v1' || !iv || !tag || !body) throw new OpError(500, 'The saved key for this install is in a format this version cannot read. Edit the install and paste its key again.');
  try {
    const decipher = createDecipheriv('aes-256-gcm', cipherKey(), Buffer.from(iv, 'base64'));
    decipher.setAAD(Buffer.from(installId, 'utf8'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(body, 'base64')), decipher.final()]).toString('utf8');
  } catch (error) {
    if (error instanceof OpError) throw error;
    throw new OpError(500, 'The saved key for this install could not be read with the current CRM_INSTALLS_KEY. Edit the install and paste its key again.');
  }
}

/** The last 4 characters, the only part of a key that is ever shown. */
export function keyHint(apiKey: string): string {
  return apiKey.slice(-4);
}
