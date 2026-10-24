import type { BlogArticleSummary } from 'babylovegrowth-next-js-blog';

/** Hand-built posts that live in their own route folders, listed alongside the BabyLoveGrowth articles. */
export const LOCAL_POSTS: Pick<BlogArticleSummary, 'slug' | 'title' | 'meta_description' | 'published_at'>[] = [
  {
    slug: 'dont-let-your-agency-hold-you-back',
    title: "Don't Let Your Marketing Agency Hold You Back",
    meta_description:
      'Ten years with the same agency? Social handed to whoever had time? The signs your marketing is holding you back, and what better marketing looks like.',
    published_at: '2026-10-16',
  },
];
