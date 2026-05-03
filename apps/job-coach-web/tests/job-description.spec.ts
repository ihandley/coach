import { test, expect } from "@playwright/test";

test("expanded job row shows detail tabs and the tailoring action", async ({ page }) => {
  await page.goto("/jobs");

  const rows = page.locator('[data-testid="job-row"]');
  await expect(rows.first()).toBeVisible();

  await rows.first().click();

  const tabRow = page.getByTestId("job-details-tab-row");
  await expect(tabRow.getByRole("tab", { name: "Structured View" })).toBeVisible();
  await expect(tabRow.getByRole("tab", { name: "Original Posting" })).toBeVisible();
  await expect(
    tabRow.getByRole("button", { name: "Tailor Resume" }),
  ).toBeVisible();
  await expect(page.getByLabel("Resume profile")).toHaveCount(0);
});

test("job description can switch between structured and original posting tabs", async ({ page }) => {
  await page.goto("/jobs");

  const rows = page.locator('[data-testid="job-row"]');
  await expect(rows.first()).toBeVisible();

  await rows.first().click();

  await expect(page.getByRole("heading", { name: "Company" })).toBeVisible();
  await expect(
    page.getByText("What does success look like in the first 30, 60, 90 days?"),
  ).toHaveCount(0);

  await page.getByRole("tab", { name: "Original Posting" }).click();
  await expect(
    page.getByText("What does success look like in the first 30, 60, 90 days?"),
  ).toBeVisible();

  await page.getByRole("tab", { name: "Structured View" }).click();
  await expect(page.getByRole("heading", { name: "Company" })).toBeVisible();
});
