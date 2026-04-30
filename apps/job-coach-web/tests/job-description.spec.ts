import { test, expect } from "@playwright/test";

test("expanded job row shows job description toggle", async ({ page }) => {
  await page.goto("/jobs");

  const rows = page.locator('[data-testid="job-row"]');
  await expect(rows.first()).toBeVisible();

  await rows.first().click();

  await expect(page.getByRole("button", { name: "Overview" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Original Posting" })).toBeVisible();
});

test("job description can toggle between structured and raw views", async ({ page }) => {
  await page.goto("/jobs");

  const rows = page.locator('[data-testid="job-row"]');
  await expect(rows.first()).toBeVisible();

  await rows.first().click();

  await page.getByRole("button", { name: "Original Posting" }).click();
  await expect(page.getByRole("button", { name: "Original Posting" })).toBeVisible();

  await page.getByRole("button", { name: "Overview" }).click();
  await expect(page.getByRole("button", { name: "Overview" })).toBeVisible();
});
