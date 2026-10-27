import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveDeployment } from '@/lib/deployment';

describe('resolveDeployment', () => {
  it('defaults to localhost at the root', () => {
    expect(resolveDeployment(undefined)).toEqual({
      siteUrl: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      basePath: '',
    });
  });

  it('derives the base path for a GitHub Pages project site', () => {
    expect(resolveDeployment('https://user.github.io/Portfolio/')).toEqual({
      siteUrl: 'https://user.github.io/Portfolio',
      origin: 'https://user.github.io',
      basePath: '/Portfolio',
    });
  });

  it('supports a custom domain at the root', () => {
    expect(resolveDeployment('https://example.com').basePath).toBe('');
  });

  it.each(['not a url', 'ftp://example.com', 'https://example.com/?q=1', 'https://example.com/a b'])(
    'rejects %s',
    (value) => {
      expect(() => resolveDeployment(value)).toThrow();
    },
  );
});

describe('URL helpers under a non-root base path', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function load(siteUrl: string) {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', siteUrl);
    vi.resetModules();
    return import('@/lib/urls');
  }

  it('builds absolute, trailing-slash canonical URLs including the base path', async () => {
    const urls = await load('https://user.github.io/portfolio');
    expect(urls.absoluteUrl('/about')).toBe('https://user.github.io/portfolio/about/');
    expect(urls.absoluteUrl('/')).toBe('https://user.github.io/portfolio/');
    expect(urls.absoluteUrl('/articles/x/#y')).toBe('https://user.github.io/portfolio/articles/x/#y');
  });

  it('prefixes raw asset paths with the base path but leaves files without trailing slash', async () => {
    const urls = await load('https://user.github.io/portfolio');
    expect(urls.asset('/feed.xml')).toBe('/portfolio/feed.xml');
    expect(urls.absoluteAsset('og/default.png')).toBe('https://user.github.io/portfolio/og/default.png');
    expect(urls.route('/skills')).toBe('/skills/');
    expect(urls.route('/feed.xml')).toBe('/feed.xml');
  });

  it('works unchanged at a domain root', async () => {
    const urls = await load('https://example.com');
    expect(urls.asset('/icon.svg')).toBe('/icon.svg');
    expect(urls.absoluteUrl('/contact/')).toBe('https://example.com/contact/');
  });

  it('never rewrites external URLs', async () => {
    const urls = await load('https://user.github.io/portfolio');
    expect(urls.absoluteUrl('https://github.com/x')).toBe('https://github.com/x');
    expect(urls.isExternal('mailto:a@b.co')).toBe(true);
    expect(urls.isExternal('/about/')).toBe(false);
  });
});
