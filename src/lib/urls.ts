/**
 * Centralised URL construction. Every internal link, asset reference, canonical URL and
 * structured-data URL in the application goes through these helpers so that the site
 * works identically at a domain root and under a GitHub Pages project path.
 */
import { resolveDeployment } from './deployment';

const deployment = resolveDeployment(process.env.NEXT_PUBLIC_SITE_URL);

export const SITE_URL = deployment.siteUrl;
export const BASE_PATH = deployment.basePath;

/** Normalise an internal route to the trailing-slash form used by the static export. */
export function route(path: string): string {
  if (/^[a-z]+:/i.test(path) || path.startsWith('#')) return path;
  const [pathname = '/', hash] = path.split('#');
  let p = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const isFile = /\.[a-z0-9]+$/i.test(p);
  if (!isFile && !p.endsWith('/')) p = `${p}/`;
  return hash ? `${p}#${hash}` : p;
}

/**
 * URL for a file in /public when it is referenced outside next/link or next/image
 * (e.g. <img>, fetch(), dynamic import of Pagefind). next/link adds the base path itself.
 */
export function asset(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_PATH}${p}`;
}

/** Absolute public URL for canonical links, feeds, sitemaps, Open Graph and JSON-LD. */
export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${route(path)}`;
}

/** Absolute URL for a static file (no trailing slash normalisation). */
export function absoluteAsset(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}

export function isExternal(href: string): boolean {
  return /^(https?:)?\/\//i.test(href) || href.startsWith('mailto:');
}
