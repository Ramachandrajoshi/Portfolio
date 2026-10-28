import { expect, test } from '@playwright/test';

test.describe('architecture system explorer', () => {
  test('loads lazily, selects components and plays a flow', async ({ page }) => {
    await page.goto('architecture/multi-tenant-platform/');
    // React Flow is only fetched once the section approaches the viewport.
    await page.locator('[data-component=architecture-diagram]').first().scrollIntoViewIfNeeded();
    const explorer = page.getByTestId('system-explorer').first();
    await expect(explorer).toBeVisible({ timeout: 20_000 });
    await expect(explorer.locator('.react-flow__node')).toHaveCount(16);

    // Keyboard/list alternative to clicking nodes.
    await explorer.getByTestId('component-select').selectOption({ label: 'Tenant catalogue' });
    const details = explorer.getByTestId('node-details');
    await expect(details).toContainText('Tenant catalogue');
    await expect(details).toContainText('Failure modes');
    await expect(details.getByRole('link', { name: /MT-ADR-001/ })).toBeVisible();

    // Clicking a node selects it too.
    await explorer.locator('.react-flow__node', { hasText: 'Platform API' }).click();
    await expect(details).toContainText('Platform API');

    // Step through a scenario.
    await explorer.getByRole('button', { name: 'Next step' }).click();
    await expect(explorer.getByText(/Step 1\/\d/)).toBeVisible();
    await explorer.getByRole('button', { name: 'Reset selection and view' }).click();
    await expect(explorer.getByText(/Step 1\/\d/)).toHaveCount(0);
  });

  test('keyboard: Enter on a focused node opens its details', async ({ page }) => {
    await page.goto('architecture/multi-tenant-platform/');
    await page.locator('[data-component=architecture-diagram]').first().scrollIntoViewIfNeeded();
    const explorer = page.getByTestId('system-explorer').first();
    const node = explorer.locator('.react-flow__node').first();
    await expect(node).toBeVisible({ timeout: 20_000 });
    await node.focus();
    await page.keyboard.press('Enter');
    await expect(explorer.getByTestId('node-details')).toBeVisible();
  });

  test('provides a full text catalogue without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('architecture/multi-tenant-platform/');
    const catalogue = page.getByTestId('system-catalogue').first();
    await expect(catalogue).toBeAttached();
    await expect(catalogue).toContainText('Tenant catalogue');
    await expect(catalogue).toContainText('Connections');
    // Build-time C4 diagrams are plain images with text alternatives.
    await expect(page.locator('figure[data-component=diagram] img').first()).toHaveAttribute('alt', /.+/);
    await context.close();
  });
});
