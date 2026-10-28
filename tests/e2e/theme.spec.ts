import { expect, test } from '@playwright/test';

test.describe('theme', () => {
  test('follows the system preference on first visit', async ({ browser }) => {
    for (const scheme of ['dark', 'light'] as const) {
      const context = await browser.newContext({ colorScheme: scheme });
      const page = await context.newPage();
      await page.goto('about/');
      await expect(page.locator('html')).toHaveAttribute('data-theme', scheme);
      await context.close();
    }
  });

  test('applies a stored preference before first paint (no flash)', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    await context.addInitScript(() => localStorage.setItem('rj-theme', 'dark'));
    const page = await context.newPage();
    // Capture the theme at DOMContentLoaded, before React hydrates.
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        (window as unknown as { __themeAtDcl: string }).__themeAtDcl = document.documentElement.dataset.theme ?? '';
        (window as unknown as { __bgAtDcl: string }).__bgAtDcl = getComputedStyle(document.body).backgroundColor;
      });
    });
    await page.goto('articles/');
    expect(await page.evaluate(() => (window as unknown as { __themeAtDcl: string }).__themeAtDcl)).toBe('dark');
    expect(await page.evaluate(() => (window as unknown as { __bgAtDcl: string }).__bgAtDcl)).toBe('rgb(7, 11, 22)');
    await context.close();
  });

  test('toggle switches theme and persists across navigation', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('skills/');
    await page.getByTestId('theme-toggle').first().click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.goto('services/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(245, 247, 251)');
  });

  test('without JavaScript the CSS media query still themes the page', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark' });
    const page = await context.newPage();
    await page.goto('about/');
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(7, 11, 22)');
    await context.close();
  });
});
