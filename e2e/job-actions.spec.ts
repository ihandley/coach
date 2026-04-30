import { test, expect } from "@playwright/test";

test("can apply to a job from row action", async ({ page }) => {
  await page.goto("/jobs");

  const firstRow = page.locator('[data-testid="job-row"]').first();
  await expect(firstRow).toBeVisible();

  await firstRow.getByRole("button", { name: "Apply" }).click();

  await expect(firstRow.locator('[data-testid="job-status"]')).toContainText(
    "applied",
  );
});

test("can ignore a job and it disappears from the default view", async ({
  page,
}) => {
  await page.goto("/jobs");

  const firstRow = page.locator('[data-testid="job-row"]').first();
  await expect(firstRow).toBeVisible();

  const ignoredTitle = await firstRow.getByText("Staff Software Engineer").innerText();

  await firstRow.getByRole("button", { name: "Ignore" }).click();

  await expect(page.getByText(ignoredTitle)).toHaveCount(0);
});
