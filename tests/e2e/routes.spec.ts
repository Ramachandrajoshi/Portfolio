import { expect, test } from '@playwright/test';
import { BASE_PATH, expectOneH1, ROUTES, trackProblems } from './helpers';

test.describe('static routes under the base path', () => {
  for (const route of ROUTES) {
    test(`direct navigation: /${route}`, async ({ page }) => {
      const problems = trackProblems(page);
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expectOneH1(page);
      await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
        'href',
        new RegExp(`${BASE_PATH}/${route.replace(/\//g, '\\/')}$`),
      );
      await page.waitForLoadState('networkidle');
      expect(problems, problems.join('\n')).toEqual([]);
    });
  }

  test('unknown paths render the 404 page with navigation', async ({ page }) => {
    const response = await page.goto('this-street-does-not-exist/');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/isn.t on the map/i);
    await expect(
      page
        .locator('main')
        .getByRole('link', { name: /Architecture/ })
        .first(),
    ).toBeVisible();
  });

  test('missing assets return 404 without breaking the page', async ({ page }) => {
    const missing = await page.request.get('generated/diagrams/does-not-exist.svg');
    expect(missing.status()).toBe(404);
  });

  test('client-side navigation keeps the base path', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop navigation bar');
    await page.goto('');
    await page
      .getByRole('navigation', { name: 'Primary', exact: true })
      .getByRole('link', { name: 'Architecture' })
      .click();
    await expect(page).toHaveURL(new RegExp(`${BASE_PATH}/architecture/$`));
    await page
      .getByRole('link', { name: /Multi-Tenant Platform/ })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`${BASE_PATH}/architecture/multi-tenant-platform/$`));
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Architecture');
  });

  test('feed, sitemap and robots are generated with absolute URLs', async ({ page }) => {
    const feed = await (await page.request.get('feed.xml')).text();
    expect(feed).toContain('<rss');
    expect(feed).toMatch(new RegExp(`${BASE_PATH}/articles/mdx-component-reference/`));
    const sitemap = await (await page.request.get('sitemap.xml')).text();
    expect(sitemap).toMatch(/<loc>https?:\/\/[^<]+\/architecture\/multi-tenant-platform\/<\/loc>/);
    expect(sitemap).not.toContain('rust-notes-draft');
    expect((await page.request.get('robots.txt')).status()).toBe(200);
  });

  test('drafts are not generated', async ({ page }) => {
    expect((await page.request.get('articles/rust-notes-draft/')).status()).toBe(404);
    await page.goto('articles/');
    await expect(page.getByText('Notes on Building a Small Compiler')).toHaveCount(0);
  });

  test('structured data is valid JSON with absolute URLs', async ({ page }) => {
    await page.goto('articles/mdx-component-reference/');
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      const json = JSON.stringify(JSON.parse(block));
      for (const m of json.matchAll(/"(?:url|item)":"([^"]+)"/g)) expect(m[1]).toMatch(/^https?:\/\//);
    }
  });
});
