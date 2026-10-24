import type { BlogArticleSummary } from 'babylovegrowth-next-js-blog';
import { blog } from './blog-client';

/**
 * Every published BabyLoveGrowth article, or none if the API is unreachable or the key
 * is missing, so a BabyLoveGrowth outage never takes the blog (or the build) down.
 */
export async function safeGetAllArticles(): Promise<BlogArticleSummary[]> {
  if (!process.env.BABYLOVEGROWTH_BLOG_API_KEY) return [];
  try {
    return await blog.getAllArticles();
  } catch (error) {
    console.error('[blog] BabyLoveGrowth articles failed to load', error);
    return [];
  }
}
