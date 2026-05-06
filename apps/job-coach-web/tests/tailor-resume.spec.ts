import { test, expect } from "@playwright/test";

test("can tailor a resume from job row", async ({ page }) => {
  const resumeProfileId = "11111111-1111-4111-8111-111111111111";
  const currentVersionId = "22222222-2222-4222-8222-222222222222";

  await page.goto("/jobs");

  const rows = page.locator('[data-testid="job-row"]').filter({
    hasText: "Staff Software Engineer, Predict",
  });
  await expect(rows.first()).toBeVisible();

  await rows.first().click();

  await expect(page.getByLabel("Resume profile")).toHaveCount(0);

  await page
    .getByTestId("job-details-tab-row")
    .getByRole("button", { name: "Tailor Resume" })
    .click();

  const select = page.getByLabel("Resume profile");
  await expect(select).toBeVisible();
  await expect(select.locator(`option[value="${resumeProfileId}"]`)).toHaveText("E2E Resume");

  const button = page.getByRole("button", { name: "Generate Tailored Resume" });
  await expect(button).toBeDisabled();

  await select.selectOption(resumeProfileId);

  await expect(button).toBeEnabled();

  const requestPromise = page.waitForRequest((request) => {
    return (
      request.method() === "POST" &&
      request.url().includes(`/api/resume-profiles/${resumeProfileId}/tailored-resumes`)
    );
  });
  const responsePromise = page.waitForResponse((response) => {
    return (
      response.request().method() === "POST" &&
      response.url().includes(`/api/resume-profiles/${resumeProfileId}/tailored-resumes`)
    );
  });

  await button.click();

  const request = await requestPromise;
  expect(request.postDataJSON()).toEqual({
    jobId: expect.any(String),
    sourceResumeVersionId: currentVersionId,
  });

  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();

  await expect(page.getByText("Tailored resume created.")).toBeVisible();

  await page.getByRole("link", { name: "View resumes" }).click();
  await expect(page).toHaveURL(/\/resumes$/);
  await expect(page.getByText("E2E Resume", { exact: true })).toBeVisible();
  await expect(page.getByText("E2E Resume - Pattern", { exact: true })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download E2E Resume - Pattern" }).first().click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^resume-.+\.pdf$/);
});
