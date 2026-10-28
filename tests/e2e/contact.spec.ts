import { expect, test } from '@playwright/test';

const FORMSPREE = /https:\/\/formspree\.io\/f\/.+/;

test.describe('contact form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('contact/');
    test.skip(
      (await page.getByTestId('contact-unconfigured').count()) > 0,
      'build without NEXT_PUBLIC_FORMSPREE_FORM_ID',
    );
  });

  test('validates inline and moves focus to the error summary', async ({ page }) => {
    await page.getByRole('button', { name: 'Send message' }).click();
    const summary = page.getByTestId('contact-error-summary');
    await expect(summary).toBeVisible();
    await expect(summary).toBeFocused();
    await expect(page.getByLabel(/^Email/)).toHaveAttribute('aria-invalid', 'true');
    await page.getByLabel(/^Email/).fill('not-an-email');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(summary).toContainText('name@example.com');
  });

  test('submits to Formspree and shows success', async ({ page }) => {
    let body: Record<string, string> = {};
    await page.route(FORMSPREE, async (route) => {
      body = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await page.getByLabel(/^Name/).fill('Ada Lovelace');
    await page.getByLabel(/^Email/).fill('ada@example.com');
    await page.getByLabel(/^Topic/).selectOption('System design');
    await page.getByLabel(/^Message/).fill('I would like to discuss an architecture review for a platform.');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByTestId('contact-success')).toBeVisible();
    expect(body.email).toBe('ada@example.com');
    expect(body._gotcha).toBe('');
  });

  test('shows a recoverable error when the service fails', async ({ page }) => {
    await page.route(FORMSPREE, (route) =>
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({ errors: [{ message: 'Submission rejected' }] }),
      }),
    );
    await page.getByLabel(/^Name/).fill('Ada');
    await page.getByLabel(/^Email/).fill('ada@example.com');
    await page.getByLabel(/^Topic/).selectOption('Something else');
    await page.getByLabel(/^Message/).fill('A message long enough to pass the validation rules.');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByTestId('contact-submit-error')).toContainText('Submission rejected');
    // Values are preserved for a retry.
    await expect(page.getByLabel(/^Name/)).toHaveValue('Ada');
  });

  test('the honeypot is hidden from people and assistive technology', async ({ page }) => {
    const honeypot = page.locator('input[name=_gotcha]');
    await expect(honeypot).toHaveAttribute('tabindex', '-1');
    await expect(page.getByRole('textbox', { name: /company/i })).toHaveCount(0);
  });
});
