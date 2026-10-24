import type { MetadataRoute } from 'next';
import siteContent from './content/siteContent.json';
import { FREE_TOOLS } from './lib/tools';
import { safeGetAllArticles } from './blog/lib/articles';
import { LOCAL_POSTS } from './blog/local-posts';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://taammarketing.com';

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publishedProjects = siteContent.projects.filter((p) => p.published !== false);

  const projectUrls = publishedProjects.map((project) => ({
    url: `${baseUrl}/work/${project.id}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const localSlugs = new Set(LOCAL_POSTS.map((p) => p.slug));
  const articleUrls = (await safeGetAllArticles())
    .filter((a) => !localSlugs.has(a.slug))
    .map((a) => ({
      url: `${baseUrl}/blog/${a.slug}`,
      lastModified: new Date(a.updated_at || a.published_at).toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }));

  return [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/work`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/dont-let-your-agency-hold-you-back`,
      lastModified: new Date('2026-10-16').toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    ...FREE_TOOLS.map((tool) => ({
      url: `${baseUrl}/tools/${tool.slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...projectUrls,
    ...articleUrls,
  ];
}
