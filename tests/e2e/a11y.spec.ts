import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { disableWebGL } from './helpers';

const PAGES = [
  '',
  'about/',
  'architecture/',
  'architecture/multi-tenant-platform/',
  'articles/mdx-component-reference/',
  'projects/',
  'skills/',
  'contact/',
  'resume/',
  'services/',
];

test.describe('accessibility (axe, WCAG 2.2 AA)', () => {
  for (const scheme of ['dark', 'light'] as const) {
    for (const route of PAGES) {
      test(`${scheme}: /${route}`, async ({ page }) => {
        await disableWebGL(page); // the canvas is aria-hidden; audit the stable DOM
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        const summary = results.violations.map(
          (v) => `${v.id} (${v.impact}): ${v.nodes.length} × ${v.nodes[0]?.target.join(' ')}`,
        );
        expect(summary, summary.join('\n')).toEqual([]);
      });
    }
  }
});

test.describe('keyboard access', () => {
  test('skip link moves focus to the main content', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard');
    await page.goto('about/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('tabs component supports arrow keys', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard');
    await page.goto('articles/mdx-component-reference/');
    const tablist = page.getByRole('tablist', { name: /Idempotent consumer/ });
    await tablist.getByRole('tab', { name: 'C#' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(tablist.getByRole('tab', { name: 'TypeScript' })).toBeFocused();
    await expect(tablist.getByRole('tab', { name: 'TypeScript' })).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('End');
    await expect(tablist.getByRole('tab', { name: 'SQL' })).toHaveAttribute('aria-selected', 'true');
  });

  test('focus is always visible on interactive elements', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard');
    await page.goto('architecture/');
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      const outline = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return 'none';
        const style = getComputedStyle(el);
        return `${style.outlineStyle} ${style.outlineWidth}`;
      });
      expect(outline).not.toMatch(/^none|0px/);
    }
  });
});
