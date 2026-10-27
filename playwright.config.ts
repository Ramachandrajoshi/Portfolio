import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests run against the *static export* (./out) served under a non-root base path,
 * exactly as GitHub Pages serves a project site. Build first with the same URL:
 *   NEXT_PUBLIC_SITE_URL=http://localhost:4173/portfolio NEXT_PUBLIC_FORMSPREE_FORM_ID=testform1 pnpm build
 */
const SITE_URL = process.env.E2E_SITE_URL ?? 'http://localhost:4173/portfolio';
const port = Number(new URL(SITE_URL).port || 80);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 45_000,
  use: {
    baseURL: `${SITE_URL}/`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        // Software WebGL so the 3D scene can be exercised in headless CI.
        launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
      },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /(mobile|routes|a11y)\.spec\.ts/ },
  ],
  webServer: {
    command: `tsx scripts/serve-static.ts ${port}`,
    url: `${SITE_URL}/`,
    reuseExistingServer: !process.env.CI,
    env: { NEXT_PUBLIC_SITE_URL: SITE_URL },
    timeout: 30_000,
  },
});
