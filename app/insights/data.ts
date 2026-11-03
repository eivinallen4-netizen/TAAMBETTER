import { cache } from 'react';
import { getAdminDb } from '@/lib/admin-db';
import { initializeTables } from '@/lib/init-tables';
import { getPageBySlug, getPageByToken, listPublishedPages, type Page } from '@/lib/pages/store';

// Reads for the public /insights routes. Cached per request so generateMetadata and the page share one query.

async function db() {
  const client = getAdminDb();
  await initializeTables(client);
  return client;
}

export const getPublishedPage = cache(async (slug: string): Promise<Page | null> => {
  const page = await getPageBySlug(await db(), slug);
  return page?.status === 'published' ? page : null;
});

export const getPreviewPage = cache(async (token: string): Promise<Page | null> => getPageByToken(await db(), token));

/** Empty when the database can't be reached (e.g. a build without credentials), so the build still passes. */
export async function publishedPages() {
  try {
    return await listPublishedPages(await db());
  } catch (err) {
    console.warn('Could not list published insights:', err instanceof Error ? err.message : err);
    return [];
  }
}
