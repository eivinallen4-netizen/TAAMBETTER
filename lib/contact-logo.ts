// Company logos on CRM contacts. The browser shrinks the upload to a small PNG/WebP before it's
// sent, and it's stored on the row as a data: URL and served by /api/admin/contacts/[id]/logo.

export const MAX_LOGO_CHARS = 400_000;

const LOGO_RE = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

/** '' clears the logo; null means the value isn't a logo we'll store. */
export function cleanLogo(value: unknown): string | null {
  if (value === '' || value === null) return '';
  if (typeof value !== 'string' || value.length > MAX_LOGO_CHARS || !LOGO_RE.test(value)) return null;
  return value;
}

/**
 * Selects `logo_v` instead of the logo itself: '' when there's no logo, otherwise a version that
 * changes whenever the logo does, for cache-busting the image URL.
 */
export const LOGO_VERSION_SQL = `CASE WHEN logo IS NULL OR logo = '' THEN '' ELSE length(logo) || '-' || substr(logo, -10) END AS logo_v`;
