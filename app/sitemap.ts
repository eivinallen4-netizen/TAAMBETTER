import type { MetadataRoute } from 'next';
import siteContent from './content/siteContent.json';
import { FREE_TOOLS } from './lib/tools';
import { CAREER_ROLES } from './lib/careers';
import { SITE_URL } from '@/lib/site-url';
import { publishedPages } from './blog/data';
import { LOCAL_POSTS } from './blog/local-posts';

const baseUrl = SITE_URL;

// Blog posts published from /admin/pages (or over MCP) come from the database; publishing or unpublishing one
// revalidates this. The hourly revalidate is a safety net, e.g. when the build couldn't reach the database.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await publishedPages();

  const publishedProjects = siteContent.projects.filter((p) => p.published !== false);

  const projectUrls = publishedProjects.map((project) => ({
    url: `${baseUrl}/work/${project.id}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
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
      url: `${baseUrl}/score`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/free-video-offer`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date('2026-11-11').toISOString(),
      changeFrequency: 'yearly' as const,
      priority: 0.2,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2026-11-11').toISOString(),
      changeFrequency: 'yearly' as const,
      priority: 0.2,
    },
    ...CAREER_ROLES.map((role) => ({
      url: `${baseUrl}/careers/${role.slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...FREE_TOOLS.map((tool) => ({
      url: `${baseUrl}/tools/${tool.slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...projectUrls,
    // Hand-built posts (app/blog/local-posts.ts), skipping any slug the database also has.
    ...LOCAL_POSTS.filter((post) => !posts.some((page) => page.slug === post.slug)).map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.published_at).toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...posts.map((page) => ({
      url: `${baseUrl}/blog/${page.slug}`,
      lastModified: new Date(page.updated_at).toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
