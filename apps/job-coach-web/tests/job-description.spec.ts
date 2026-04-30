import { test, expect } from "@playwright/test";

test("expanded job row shows job description toggle", async ({ page }) => {
  await page.goto("/jobs");

  const rows = page.locator('[data-testid="job-row"]');
  await expect(rows.first()).toBeVisible();

  await rows.first().click();

  await expect(page.getByRole("button", { name: "Structured" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Raw" })).toBeVisible();
});

test("job description can toggle between structured and raw views", async ({ page }) => {
  await page.goto("/jobs");

  const rows = page.locator('[data-testid="job-row"]');
  await expect(rows.first()).toBeVisible();

  await rows.first().click();

  await page.getByRole("button", { name: "Raw" }).click();
  await expect(page.getByRole("button", { name: "Raw" })).toBeVisible();

  await page.getByRole("button", { name: "Structured" }).click();
  await expect(page.getByRole("button", { name: "Structured" })).toBeVisible();
});
