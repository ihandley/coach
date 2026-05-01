import { expect, test } from "@playwright/test";

test.describe("job card structured and raw views", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/jobs");
  });

  test("shows saved structured summary sections", async ({ page }) => {
    await page.getByText("Staff Software Engineer, Predict").first().click();

    await page.getByRole("button", { name: /structured/i }).click();

    await expect(page.getByText("Lehi, UT — Hybrid")).toBeVisible();
    await expect(page.getByText("Salary range not listed")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Company" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Description" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Requirements" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Benefits" })).toBeVisible();
    await expect(page.getByText("10+ years of professional software development experience.")).toBeVisible();
    await expect(page.getByText("Unlimited PTO")).toBeVisible();
  });

  test("shows full raw job description text", async ({ page }) => {
    await page.getByText("Staff Software Engineer, Predict").first().click();

    await page.getByRole("button", { name: /raw/i }).click();

    await expect(page.getByText("What does success look like in the first 30, 60, 90 days?")).toBeVisible();
    await expect(page.getByText("How can I stand out as an applicant?")).toBeVisible();
    await expect(page.getByText("We may use artificial intelligence (AI) tools")).toBeVisible();
  });
});
