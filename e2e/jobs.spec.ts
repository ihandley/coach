import { test, expect } from '@playwright/test';

test('job row expands and collapses', async ({ page }) => {
  await page.goto('/jobs');

  const rows = page.locator('[data-testid="job-row"]');
  await expect(rows.first()).toBeVisible();

  const firstRow = rows.first();

  await firstRow.click();

  const details = page.locator('[data-testid="job-details"]');
  await expect(details.first()).toBeVisible();

  await firstRow.click();
  await expect(details.first()).toBeHidden();
});

test('clicking a job row does not navigate to a job detail route', async ({ page }) => {
  await page.goto('/jobs');

  const rows = page.locator('[data-testid="job-row"]');
  await expect(rows.first()).toBeVisible();

  await rows.first().click();

  await expect(page).toHaveURL(/\/jobs$/);
});

test('filters jobs by status', async ({ page }) => {
  await page.goto('/jobs');

  const select = page.locator('select');
  await expect(select).toBeVisible();

  const statuses = page.locator('[data-testid="job-status"]');
  await expect(statuses.first()).toBeVisible();

  const statusToFilter = (await statuses.first().innerText()).trim();

  await select.selectOption(statusToFilter);

  const filteredStatuses = page.locator('[data-testid="job-status"]');
  const count = await filteredStatuses.count();

  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    await expect(filteredStatuses.nth(i)).toHaveText(statusToFilter);
  }
});
