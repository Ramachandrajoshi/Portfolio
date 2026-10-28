import { expect, test } from '@playwright/test';

test('static Pagefind search finds case studies and articles', async ({ page }) => {
  await page.goto('search/?q=tenant');
  const results = page.getByTestId('search-results');
  await expect(results.getByRole('link', { name: /Multi-Tenant Platform/ })).toBeVisible({ timeout: 15_000 });
  await page.getByTestId('search-input').fill('outbox');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(results.getByRole('link', { name: /Component Library/ })).toBeVisible();
});

test('drafts are not in the search index', async ({ page }) => {
  await page.goto('search/?q=compiler');
  await expect(page.getByTestId('search-results')).toContainText(/result|No results/, { timeout: 15_000 });
  await expect(page.getByTestId('search-results').getByText('Notes on Building a Small Compiler')).toHaveCount(0);
});
