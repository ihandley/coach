import { test, expect } from "@playwright/test";

test.describe("jobs status UX", () => {
  test.beforeEach(async ({ request }) => {
    await request.post("http://localhost:3000/api/test/seed-job");
  });

  test("clicking table status opens popover without expanding row", async ({ page }) => {
    await page.goto("http://localhost:3000/jobs");

    const row = page.locator('[data-testid="job-row"]').first();
    await expect(row).toBeVisible();

    await row.getByTestId("job-status").click();

    await expect(page.getByRole("table").getByRole("button", { name: "applied" })).toBeVisible();
    await expect(page.locator('[data-testid="job-details"]')).toHaveCount(0);
  });

  test("table status popover updates the badge optimistically", async ({ page }) => {
    await page.route("**/api/jobs/*/status", async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("http://localhost:3000/jobs");

    const row = page.locator('[data-testid="job-row"]').first();
    await expect(row).toBeVisible();

    await row.getByTestId("job-status").click();
    await page.getByRole("table").getByRole("button", { name: "applied" }).click();

    await expect(row.getByTestId("job-status")).toContainText("applied");
    await expect(page).toHaveURL(/\/jobs$/);
  });

  test("expanded row shows editable inline status select", async ({ page }) => {
    await page.route("**/api/jobs/*/status", async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("http://localhost:3000/jobs");

    const row = page.locator('[data-testid="job-row"]').first();
    await expect(row).toBeVisible();

    await row.click();

    const details = page.locator('[data-testid="job-details"]').first();
    await expect(details).toBeVisible();

    const statusSelect = details.getByLabel("Job status");
    await expect(statusSelect).toBeVisible();

    await statusSelect.selectOption("interviewing");

    await expect(statusSelect).toHaveValue("interviewing");
  });
});
