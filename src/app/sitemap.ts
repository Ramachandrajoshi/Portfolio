import type { MetadataRoute } from 'next';
import { allArticles, allCaseStudies, allProjects, allTags } from '@/content';
import { testimonials } from '@/data/testimonials';
import { absoluteUrl } from '@/lib/urls';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '/',
    '/about/',
    '/architecture/',
    '/projects/',
    '/skills/',
    '/services/',
    '/articles/',
    '/contact/',
    '/resume/',
  ];
  if (testimonials.length > 0) staticRoutes.push('/testimonials/');
  return [
    ...staticRoutes.map((path) => ({
      url: absoluteUrl(path),
      changeFrequency: 'monthly' as const,
      priority: path === '/' ? 1 : 0.7,
    })),
    ...allCaseStudies.map((c) => ({ url: absoluteUrl(c.url), lastModified: c.updated ?? c.date, priority: 0.9 })),
    ...allArticles.map((a) => ({ url: absoluteUrl(a.url), lastModified: a.updated ?? a.date, priority: 0.8 })),
    ...allProjects.map((p) => ({ url: absoluteUrl(p.url), lastModified: p.date, priority: 0.7 })),
    ...allTags().map(({ tag }) => ({ url: absoluteUrl(`/articles/tags/${tag}/`), priority: 0.3 })),
  ];
}
