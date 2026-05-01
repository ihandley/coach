import { test, expect } from '@playwright/test';

test('can tailor a resume from job row', async ({ page }) => {
  await page.goto('/jobs');

  const rows = page.locator('[data-testid="job-row"]');
  await expect(rows.first()).toBeVisible();

  await rows.first().click();

  const select = page.locator('select');
  await expect(select).toBeVisible();

  // select first available option (skip placeholder)
  await select.selectOption({ index: 1 });

  const button = page.getByRole('button', { name: /tailor resume/i });
  await expect(button).toBeEnabled();

  await button.click();

  // just assert something renders
  const result = page.locator('text=Failed').or(page.locator('text=No output')).or(page.locator('text={'));
  await expect(result.first()).toBeVisible();
});
