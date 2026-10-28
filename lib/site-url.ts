const CANONICAL_HOST = 'www.taammarketing.com';

/**
 * The public origin every canonical, sitemap and absolute link is built on. The live site
 * serves from www (the bare domain 308s there), so the bare domain is upgraded to www:
 * an absolute URL on the bare domain is a redirect, which search engines flag.
 */
function resolveSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || `https://${CANONICAL_HOST}`).replace(/\/+$/, '');
  return raw.replace(/^https?:\/\/taammarketing\.com$/, `https://${CANONICAL_HOST}`);
}

export const SITE_URL = resolveSiteUrl();
