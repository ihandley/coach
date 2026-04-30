import { test, expect } from '@playwright/test';

async function showOnlyStatus(page, status) {
  const statuses = ['Saved', 'Applied', 'Interviewing', 'Rejected', 'Offer', 'Archived'];

  for (const label of statuses) {
    const chip = page.getByRole('button', { name: label });
    const pressed = await chip.getAttribute('aria-pressed');

    if (label.toLowerCase() === status.toLowerCase()) {
      if (pressed !== 'true') await chip.click();
    } else {
      if (pressed === 'true') await chip.click();
    }
  }
}

test('job row expands and collapses', async ({ page }) => {
  await page.goto('/jobs');

  const rows = page.getByTestId('job-row');
  await expect(rows.first()).toBeVisible();

  const firstRow = rows.first();

  await firstRow.click();

  const details = page.getByTestId('job-details');
  await expect(details.first()).toBeVisible();

  await firstRow.click();
  await expect(details.first()).toBeHidden();
});

test('clicking a job row does not navigate to a job detail route', async ({ page }) => {
  await page.goto('/jobs');

  const rows = page.getByTestId('job-row');
  await expect(rows.first()).toBeVisible();

  await rows.first().click();

  await expect(page).toHaveURL(/\/jobs$/);
});

test('filters jobs by status', async ({ page }) => {
  await page.goto('/jobs');

  await showOnlyStatus(page, 'Rejected');

  await expect(page.getByTestId('job-row').filter({ hasText: /Senior Backend Engineer/i }).first()).toBeVisible();
});

test('status chips show and hide matching jobs', async ({ page }) => {
  await page.goto('/jobs');

  await showOnlyStatus(page, 'Rejected');

  await expect(page.getByTestId('job-row').filter({ hasText: /Senior Backend Engineer/i }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Rejected' }).click();

  await expect(page.getByTestId('job-row').filter({ hasText: /Senior Backend Engineer/i })).toHaveCount(0);
});

test('status chips can show all seeded statuses', async ({ page }) => {
  await page.goto('/jobs');

  const cases = [
    ['Saved', /Staff Software Engineer/i],
    ['Rejected', /Senior Backend Engineer/i],
    ['Archived', /Full Stack Engineer/i],
  ];

  for (const [status, title] of cases) {
    await showOnlyStatus(page, status);
    await expect(page.getByTestId('job-row').filter({ hasText: title }).first()).toBeVisible();
  }
});
