import type { MetadataRoute } from 'next';
import siteContent from './content/siteContent.json';
import { FREE_TOOLS } from './lib/tools';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://taammarketing.com';

export default function sitemap(): MetadataRoute.Sitemap {
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
    ...FREE_TOOLS.map((tool) => ({
      url: `${baseUrl}/tools/${tool.slug}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...projectUrls,
  ];
}
