import type { MetadataRoute } from 'next';
import portfolio from '@/data/portfolio';
import { getSiteUrl } from '@/lib/site';

const BASE_URL = getSiteUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  const projectRoutes: MetadataRoute.Sitemap = portfolio.projects.map(
    (project) => ({
      url: `${BASE_URL}/projects/${project.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    })
  );

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    ...projectRoutes,
  ];
}
