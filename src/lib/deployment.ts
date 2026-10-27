/**
 * Deployment configuration — the single place that decides *where* the site lives.
 *
 * Exactly one input variable controls it: `NEXT_PUBLIC_SITE_URL`, the absolute public
 * URL of the site root *including* any sub-path, without a trailing slash.
 *
 *   GitHub Pages project site → https://<user>.github.io/<repository>
 *   Custom domain at the root → https://example.com
 *   Local development         → http://localhost:3000 (default)
 *
 * The Next.js `basePath` / `assetPrefix` are derived from the URL's pathname, so the
 * repository name is never hard-coded anywhere in the source tree.
 *
 * This module is imported by next.config.ts, build scripts and application code, so it
 * must stay dependency-free and side-effect-free.
 */

export const DEFAULT_SITE_URL = 'http://localhost:3000';

export interface DeploymentConfig {
  /** Absolute origin + path, no trailing slash. e.g. https://user.github.io/portfolio */
  siteUrl: string;
  /** Origin only. e.g. https://user.github.io */
  origin: string;
  /** '' for root deployments, otherwise '/sub-path' (leading slash, no trailing slash). */
  basePath: string;
}

export function resolveDeployment(rawSiteUrl: string | undefined): DeploymentConfig {
  const input = (rawSiteUrl ?? '').trim() || DEFAULT_SITE_URL;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must be an absolute URL (received "${input}"). ` +
        'Example: https://username.github.io/repository',
    );
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`NEXT_PUBLIC_SITE_URL must use http or https (received "${input}").`);
  }
  if (url.search || url.hash) {
    throw new Error('NEXT_PUBLIC_SITE_URL must not contain a query string or fragment.');
  }
  const basePath = url.pathname.replace(/\/+$/, '');
  if (basePath && !/^(\/[A-Za-z0-9._~-]+)+$/.test(basePath)) {
    throw new Error(`NEXT_PUBLIC_SITE_URL has an unsupported path "${url.pathname}".`);
  }
  return {
    siteUrl: `${url.origin}${basePath}`,
    origin: url.origin,
    basePath,
  };
}
