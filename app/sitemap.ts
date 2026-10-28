import type { MetadataRoute } from 'next';
import siteContent from './content/siteContent.json';
import { FREE_TOOLS } from './lib/tools';
import { CAREER_ROLES } from './lib/careers';
import { SITE_URL } from '@/lib/site-url';

const baseUrl = SITE_URL;

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
      url: `${baseUrl}/blog/dont-let-your-agency-hold-you-back`,
      lastModified: new Date('2026-10-16').toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
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
  ];
}
