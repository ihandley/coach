import { test, expect } from "@playwright/test";

test.describe("jobs bulk selection", () => {
  test.beforeEach(async ({ request }) => {
    await request.post("http://localhost:3000/api/test/seed-job");
  });

  test("checkboxes are visible and selecting a row shows selected count", async ({ page }) => {
    await page.goto("http://localhost:3000/jobs");

    const rows = page.locator('[data-testid="job-row"]');
    await expect(rows.first()).toBeVisible();

    const firstCheckbox = rows.first().locator('input[type="checkbox"]');
    await expect(firstCheckbox).toBeVisible();
    await expect(firstCheckbox).toBeEnabled();
    await expect(firstCheckbox).not.toBeChecked();

    await firstCheckbox.check();

    await expect(firstCheckbox).toBeChecked();
    await expect(page.getByText(/1 selected|One selected/i)).toBeVisible();
  });

  test("clicking checkbox does not expand the row", async ({ page }) => {
    await page.goto("http://localhost:3000/jobs");

    const rows = page.locator('[data-testid="job-row"]');
    await expect(rows.first()).toBeVisible();

    const firstCheckbox = rows.first().locator('input[type="checkbox"]');
    await firstCheckbox.check();

    await expect(page.locator('[data-testid="job-details"]')).toHaveCount(0);
  });

  test("clear button removes all selections", async ({ page }) => {
    await page.goto("http://localhost:3000/jobs");

    const rows = page.locator('[data-testid="job-row"]');
    await expect(rows.first()).toBeVisible();

    const firstCheckbox = rows.first().locator('input[type="checkbox"]');
    await firstCheckbox.check();

    await expect(firstCheckbox).toBeChecked();

    await page.getByRole("button", { name: /clear/i }).click();

    await expect(firstCheckbox).not.toBeChecked();
    await expect(page.getByText(/selected/i)).toHaveCount(0);
  });
  test("select all visible jobs checks every visible row", async ({ page }) => {
    await page.goto("http://localhost:3000/jobs");

    const rows = page.locator('[data-testid="job-row"]');
    await expect(rows.first()).toBeVisible();

    const checkboxes = rows.locator('input[type="checkbox"]');
    const visibleCount = await checkboxes.count();

    await page.getByLabel("Select all visible jobs").check();

    await expect(page.getByText(`${visibleCount} selected`)).toBeVisible();

    for (let i = 0; i < visibleCount; i++) {
      await expect(checkboxes.nth(i)).toBeChecked();
    }
  });

  test("bulk status dropdown appears when rows selected", async ({ page }) => {
    await page.goto("http://localhost:3000/jobs");

    const rows = page.locator('[data-testid="job-row"]');
    await expect(rows.first()).toBeVisible();

    const checkbox = rows.first().locator('input[type="checkbox"]');
    await checkbox.check();

    const dropdown = page.getByLabel("Bulk status update");
    await expect(dropdown).toBeVisible();
  });

  test("bulk status triggers API call", async ({ page }) => {
    await page.goto("http://localhost:3000/jobs");

    await page.route("**/api/jobs/bulk-update", async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    const rows = page.locator('[data-testid="job-row"]');
    await expect(rows.first()).toBeVisible();

    const checkbox = rows.first().locator('input[type="checkbox"]');
    await checkbox.check();

    await page.getByLabel("Bulk status update").selectOption("applied");
  });

  test("bulk status updates UI optimistically", async ({ page }) => {
    await page.goto("http://localhost:3000/jobs");

    await page.route("**/api/jobs/bulk-update", async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    const row = page.locator('[data-testid="job-row"]').first();
    await expect(row).toBeVisible();

    await row.locator('input[type="checkbox"]').check();

    await page.getByLabel("Bulk status update").selectOption("applied");

    // Expect UI to reflect new status
    await expect(row).toContainText(/applied/i);
  });

  test("bulk status persists after reload", async ({ page }) => {
    await page.goto("http://localhost:3000/jobs");

    const row = page.locator('[data-testid="job-row"]').first();
    await expect(row).toBeVisible();

    await row.locator('input[type="checkbox"]').check();
    await page.getByLabel("Bulk status update").selectOption("applied");

    await page.reload();

    await expect(row).toContainText(/applied/i);
  });
});
