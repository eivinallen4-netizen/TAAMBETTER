export interface BlogPost {
  slug: string;
  title: string;
  meta_description: string;
  published_at: string;
}

/** Hand-built posts, each in its own route folder under /blog. */
export const LOCAL_POSTS: BlogPost[] = [
  {
    slug: 'dont-let-your-agency-hold-you-back',
    title: "Don't Let Your Marketing Agency Hold You Back",
    meta_description:
      'Ten years with the same agency? Social handed to whoever had time? The signs your marketing is holding you back, and what better marketing looks like.',
    published_at: '2026-10-16',
  },
];
