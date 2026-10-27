import { expect, test } from '@playwright/test';
import { disableWebGL, trackProblems } from './helpers';

test.describe('3D hero', () => {
  test('content and actions are available before (and without) the 3D scene', async ({ page }) => {
    await disableWebGL(page);
    await page.goto('');
    await expect(page.getByRole('heading', { level: 1, name: 'Ramachandra Joshi' })).toBeVisible();
    await expect(page.getByTestId('hero-poster')).toBeVisible();
    const actions = page.getByRole('navigation', { name: 'Primary actions' });
    for (const label of ['Architecture', 'Projects', 'Articles', 'Résumé', 'Contact'])
      await expect(actions.getByRole('link', { name: label })).toBeVisible();
  });

  test('falls back gracefully when WebGL is unavailable', async ({ page }) => {
    const problems = trackProblems(page);
    await disableWebGL(page);
    await page.goto('');
    await expect(page.getByTestId('webgl-unsupported')).toBeVisible();
    await expect(page.getByTestId('city-experience')).toHaveCount(0);
    await page.getByRole('navigation', { name: 'Primary actions' }).getByRole('link', { name: 'Architecture' }).click();
    await expect(page).toHaveURL(/\/architecture\/$/);
    expect(problems).toEqual([]);
  });

  test('recovers when WebGL initialisation fails after the capability probe', async ({ browser }) => {
    // Reduced motion keeps the scene from auto-starting, so the opt-in path is exercised too.
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    // The probe uses a detached canvas; make only the real (attached) canvas fail.
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
        if (/webgl/i.test(type) && this.isConnected) return null;
        return (original as (...a: unknown[]) => unknown).call(this, type, ...args);
      } as typeof original;
    });
    await page.goto('');
    await page.getByTestId('enter-city').click();
    await expect(page.getByTestId('webgl-failed')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await context.close();
  });

  test('reduced motion: the scene waits for an explicit opt-in', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('');
    await page.waitForTimeout(3000);
    await expect(page.locator('[data-hero-phase]')).toHaveAttribute('data-hero-phase', 'poster');
    await expect(page.getByTestId('hero-3d-status')).toContainText(/Reduced motion/i);
    await expect(page.getByTestId('enter-city')).toBeVisible();
    await context.close();
  });

  test('classic mode prevents the 3D scene from loading and persists', async ({ page }) => {
    await page.goto('about/');
    await page.getByTestId('classic-toggle').first().click();
    await page.goto('');
    await page.waitForTimeout(3000);
    await expect(page.locator('[data-hero-phase]')).toHaveAttribute('data-hero-phase', 'poster');
    await expect(page.getByTestId('hero-3d-status')).toContainText(/Classic mode/i);
  });

  test('loads the city, supports keyboard interaction and the district list', async ({ page }) => {
    test.slow(); // software WebGL in CI
    const requests: string[] = [];
    page.on('request', (r) => requests.push(r.url()));
    await page.goto('');
    await expect(page.locator('[data-hero-phase]')).toHaveAttribute('data-hero-phase', 'ready', { timeout: 60_000 });
    const city = page.getByTestId('city-experience');
    await expect(city).toBeVisible();
    // Skip the intro, then use the keyboard alternative: fly to a district.
    const skip = page.getByRole('button', { name: 'Skip intro' });
    if (await skip.isVisible()) await skip.click();
    await page
      .getByRole('navigation', { name: 'City districts' })
      .getByRole('button', { name: 'System Architecture' })
      .click();
    const panel = page.getByTestId('landmark-panel');
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('link', { name: /case studies/ })).toBeFocused();
    // Escape closes the panel and returns focus to the city.
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(city).toBeFocused();
    // E re-opens it (the character stands at the landmark's approach point).
    await page.keyboard.press('KeyE');
    await expect(panel).toBeVisible();
    await panel.getByRole('link', { name: /case studies/ }).click();
    await expect(page).toHaveURL(/\/architecture\/$/);
  });

  test('keys do not scroll the page or move the character unless the city has focus', async ({ page }) => {
    test.slow();
    await page.goto('');
    await expect(page.locator('[data-hero-phase]')).toHaveAttribute('data-hero-phase', 'ready', { timeout: 60_000 });
    await page.getByRole('link', { name: 'Skip to content' }).focus();
    await page.keyboard.press('Space');
    // Space on a focused link/body scrolls normally: the city did not capture it.
    await expect
      .poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-testid')))
      .not.toBe('city-experience');
  });

  test('the 3D runtime is not downloaded on content pages', async ({ page }) => {
    const scripts: string[] = [];
    page.on('response', async (r) => {
      if (r.url().endsWith('.js')) scripts.push(await r.text().catch(() => ''));
    });
    await page.goto('articles/mdx-component-reference/');
    await page.waitForLoadState('networkidle');
    expect(scripts.some((s) => s.includes('WebGLRenderer'))).toBe(false);
  });
});
