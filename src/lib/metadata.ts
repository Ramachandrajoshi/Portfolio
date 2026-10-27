import type { Metadata } from 'next';
import { profile } from '@/data/profile';
import { absoluteAsset, absoluteUrl } from './urls';

export const SITE_NAME = `${profile.name} — ${profile.title}`;
export const DEFAULT_DESCRIPTION = profile.positioning;

interface PageMetadataInput {
  title: string;
  description: string;
  /** Route path, e.g. "/architecture/multi-tenant-platform/". */
  path: string;
  /** Path to a generated social image under /public, e.g. "/og/articles/x.png". */
  image?: string;
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  noindex?: boolean;
}

/**
 * Builds complete, absolute metadata for a page. Canonical/OG URLs are constructed with
 * absoluteUrl() rather than Next's metadataBase resolution, because a relative URL such
 * as "/about/" resolved against "https://user.github.io/repo" would drop the base path.
 */
export function pageMetadata(input: PageMetadataInput): Metadata {
  const url = absoluteUrl(input.path);
  const image = absoluteAsset(input.image ?? '/og/default.png');
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      type: input.type ?? 'website',
      url,
      title: input.title,
      description: input.description,
      siteName: SITE_NAME,
      locale: 'en_GB',
      images: [{ url: image, width: 1200, height: 630, alt: input.title }],
      ...(input.type === 'article'
        ? {
            publishedTime: input.publishedTime,
            modifiedTime: input.modifiedTime ?? input.publishedTime,
            authors: [absoluteUrl('/about/')],
            tags: input.tags,
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [image],
    },
    robots: input.noindex ? { index: false, follow: true } : undefined,
  };
}
