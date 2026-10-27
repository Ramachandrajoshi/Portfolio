import type { MetadataRoute } from 'next';
import { absoluteAsset } from '@/lib/urls';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  // Note: on a GitHub Pages *project* site this file is served at /<repo>/robots.txt, which
  // crawlers do not read; it becomes authoritative once the site moves to a custom domain.
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: absoluteAsset('/sitemap.xml'),
  };
}
