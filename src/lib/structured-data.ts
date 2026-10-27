import type { Article, BreadcrumbList, Person, WebSite, WithContext } from 'schema-dts';
import { profile } from '@/data/profile';
import { absoluteAsset, absoluteUrl, SITE_URL } from './urls';

// Only verified facts go into structured data: no ratings, no invented credentials.
export function personSchema(): WithContext<Person> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}/#person`,
    name: profile.name,
    jobTitle: profile.title,
    url: absoluteUrl('/about/'),
    sameAs: [profile.links.github, profile.links.linkedin],
    ...(profile.employer.verifiedName
      ? { worksFor: { '@type': 'Organization', name: profile.employer.name, url: profile.employer.url } }
      : {}),
    knowsAbout: profile.focusAreas.map((f) => f.title),
  };
}

export function websiteSchema(): WithContext<WebSite> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: `${profile.name} — ${profile.title}`,
    url: absoluteUrl('/'),
    author: { '@id': `${SITE_URL}/#person` },
    inLanguage: 'en',
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleSchema(input: {
  title: string;
  description: string;
  path: string;
  date: string;
  updated?: string;
  tags: string[];
  image: string;
}): WithContext<Article> {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    mainEntityOfPage: absoluteUrl(input.path),
    datePublished: input.date,
    dateModified: input.updated ?? input.date,
    keywords: input.tags.join(', '),
    image: absoluteAsset(input.image),
    author: { '@type': 'Person', '@id': `${SITE_URL}/#person`, name: profile.name, url: absoluteUrl('/about/') },
    publisher: { '@type': 'Person', '@id': `${SITE_URL}/#person`, name: profile.name },
    inLanguage: 'en',
  } as WithContext<Article>;
}
