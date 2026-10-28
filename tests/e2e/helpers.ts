import { expect, type Page } from '@playwright/test';

export const BASE_PATH = new URL(process.env.E2E_SITE_URL ?? 'http://localhost:4173/portfolio').pathname.replace(
  /\/$/,
  '',
);

export const ROUTES = [
  '',
  'about/',
  'architecture/',
  'architecture/multi-tenant-platform/',
  'projects/',
  'projects/immersive-architecture-portfolio/',
  'skills/',
  'services/',
  'testimonials/',
  'articles/',
  'articles/mdx-component-reference/',
  'contact/',
  'resume/',
  'search/',
];

/** Collects failed requests and console errors so tests can assert a clean page. */
export function trackProblems(page: Page) {
  const problems: string[] = [];
  page.on('response', (response) => {
    const url = response.url();
    // Prefetches of routes are fine to ignore only if they are not 404s — none should be.
    if (response.status() >= 400 && url.startsWith(new URL(page.url() || 'http://localhost').origin))
      problems.push(`${response.status()} ${url}`);
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && !/WebGL|GPU stall|swiftshader/i.test(message.text()))
      problems.push(`console: ${message.text()}`);
  });
  return problems;
}

export async function disableWebGL(page: Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (/webgl/i.test(type)) return null;
      return (original as (...a: unknown[]) => unknown).call(this, type, ...args);
    } as typeof original;
  });
}

export async function expectOneH1(page: Page) {
  await expect(page.locator('h1')).toHaveCount(1);
}
