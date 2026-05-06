import { expect, test } from "@playwright/test";

test("importing a job shows a persisted match score", async ({ page }) => {
  let importCompleted = false;

  await page.route("**/api/jobs/ranked", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        importCompleted
          ? [
              {
                id: "job-imported-match",
                title: "Imported Match Role",
                company: "Acme",
                status: "saved",
                sourceUrl: "https://example.com/imported-match-role",
                sourceText: "Build TypeScript and React product workflows.",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                score: 0.67,
                structuredSummary: null,
              },
            ]
          : [],
      ),
    });
  });

  await page.route("**/api/jobs", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    importCompleted = true;

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        id: "job-imported-match",
        title: "Imported Match Role",
        company: "Acme",
      }),
    });
  });

  await page.goto("/jobs");

  await expect(page.getByText("No jobs yet. Import one to get started.")).toBeVisible();

  await page.getByPlaceholder("Paste job URL").fill("https://example.com/imported-match-role");
  await page.getByRole("button", { name: "Import" }).click();

  const row = page.getByTestId("job-row").filter({ hasText: "Imported Match Role" });

  await expect(row).toBeVisible();
  await expect(row.getByRole("meter", { name: "Match score 67%" })).toBeVisible();
  await expect(row.getByText("Not matched")).toHaveCount(0);
});
