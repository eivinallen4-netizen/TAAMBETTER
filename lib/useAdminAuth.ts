'use client';

/**
 * Kept so the website's own admin pages need no changes. The CRM frame around them (the
 * layout.tsx next to each of those pages) already shows the sign-in screen to anyone who is
 * signed out, and every API route checks the session itself.
 */
export function useAdminAuth() {}
