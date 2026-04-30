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

  const rejectedChip = page.getByRole('button', { name: 'rejected' });
  await expect(rejectedChip).toBeVisible();

  const statuses = page.locator('[data-testid="job-status"]');

  for (const status of await statuses.allTextContents()) {
    expect(status.trim().toLowerCase()).not.toBe('rejected');
  }

  await rejectedChip.click();

  await expect(page.locator('[data-testid="job-status"]').filter({ hasText: 'rejected' }).first()).toBeVisible();
});

test('status chips show and hide matching jobs', async ({ page }) => {
  await page.goto('/jobs');

  const rejectedChip = page.getByRole('button', { name: 'rejected' });
  await expect(rejectedChip).toBeVisible();

  await rejectedChip.click();
  await expect(page.locator('[data-testid="job-status"]').filter({ hasText: 'rejected' }).first()).toBeVisible();

  await rejectedChip.click();
  await expect(page.locator('[data-testid="job-status"]').filter({ hasText: 'rejected' })).toHaveCount(0);
});

test('status chips can show all seeded statuses', async ({ page }) => {
  await page.goto('/jobs');

  for (const status of ['rejected', 'archived']) {
    const chip = page.getByRole('button', { name: status });
    await expect(chip).toBeVisible();
    await chip.click();
    await expect(page.locator('[data-testid="job-status"]').filter({ hasText: status }).first()).toBeVisible();
  }
});
