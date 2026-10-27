import { expect, test } from '@playwright/test';

test.describe('mobile navigation', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile only');

  test('menu opens as a modal dialog, navigates, and closes with Escape', async ({ page }) => {
    await page.goto('');
    await page.getByTestId('mobile-menu-trigger').click();
    const menu = page.getByTestId('mobile-menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('heading', { name: 'Navigate the city' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(page.getByTestId('mobile-menu-trigger')).toBeFocused();

    await page.getByTestId('mobile-menu-trigger').click();
    await menu.getByRole('link', { name: /Articles/ }).click();
    await expect(page).toHaveURL(/\/articles\/$/);
    await expect(menu).toBeHidden();
  });

  test('pages do not scroll horizontally', async ({ page }) => {
    for (const route of ['', 'architecture/multi-tenant-platform/', 'articles/mdx-component-reference/', 'skills/']) {
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, route).toBeLessThanOrEqual(1);
    }
  });
});
