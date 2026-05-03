import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { JobsPageClient } from "./jobs-page-client";

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json",
    },
    status: 200,
    ...init,
  });
}

describe("JobsPageClient", () => {
  const rankedJob = {
    id: "job-1",
    title: "Product Engineer",
    company: "Pattern",
    status: "saved",
    sourceUrl: "https://example.com/job",
    sourceText: "Build thoughtful product workflows.",
    createdAt: "2026-04-25T12:00:00.000Z",
    updatedAt: "2026-04-26T12:00:00.000Z",
    score: 0.82,
    structuredSummary: {
      location: "Remote",
      salaryRange: "$120,000 to $140,000",
      companyInfo: ["Pattern builds hiring tools."],
      jobDescription: ["Build product workflows."],
      requirements: ["TypeScript"],
      benefits: ["Remote work"],
    },
  };

  let fetchMock: ReturnType<typeof vi.fn>;
  let deleteShouldFail: boolean;

  beforeEach(() => {
    deleteShouldFail = false;

    fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();

      if (url === "/api/jobs/ranked") {
        return jsonResponse([rankedJob]);
      }

      if (url === "/api/resume-profiles") {
        return jsonResponse([
          {
            id: "profile-empty",
            name: "No Current Resume",
            currentVersionId: "",
          },
          {
            id: "profile-current",
            name: "Current Resume",
            currentVersionId: "version-1",
          },
        ]);
      }

      if (
        url === "/api/resume-profiles/profile-current/tailored-resumes" &&
        init?.method === "POST"
      ) {
        return jsonResponse({
          tailoredResume: {
            id: "profile-tailored",
            name: "Current Resume - Pattern",
            profileId: "profile-tailored",
            versionId: "version-tailored",
          },
          suggestions: [
            {
              id: "suggestion-1",
            },
          ],
        });
      }

      if (url === "/api/jobs" && init?.method === "POST") {
        return jsonResponse(
          {
            id: "job-new",
            title: "Imported Job",
          },
          { status: 201 },
        );
      }

      if (url === "/api/jobs/job-1" && init?.method === "DELETE") {
        return deleteShouldFail
          ? jsonResponse({ error: "Unable to delete job." }, { status: 500 })
          : new Response(null, { status: 204 });
      }

      return jsonResponse({ error: `Unhandled request: ${url}` }, { status: 500 });
    });

    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("shows the delete action only inside the expanded job details card", async () => {
    render(<JobsPageClient />);

    expect(await screen.findByText("Product Engineer")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete job" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("job-row"));

    expect(
      within(screen.getByTestId("job-details")).getByRole("button", { name: "Delete job" }),
    ).toBeInTheDocument();
  });

  it("renders structured and original posting details with expanded-card controls", async () => {
    render(<JobsPageClient />);

    fireEvent.click(await screen.findByTestId("job-row"));

    const details = screen.getByTestId("job-details");

    expect(within(details).getByRole("button", { name: "Delete job" })).toBeInTheDocument();
    expect(within(details).getByRole("button", { name: "Tailor Resume" })).toBeInTheDocument();
    expect(within(details).getByText("Company")).toBeInTheDocument();
    expect(within(details).getByText("Pattern builds hiring tools.")).toBeInTheDocument();
    expect(within(details).getByText("Description")).toBeInTheDocument();
    expect(within(details).getByText("Build product workflows.")).toBeInTheDocument();
    expect(within(details).getByText("Requirements")).toBeInTheDocument();
    expect(within(details).getByText("TypeScript")).toBeInTheDocument();
    expect(within(details).getByText("Benefits")).toBeInTheDocument();
    expect(within(details).getByText("Remote work")).toBeInTheDocument();

    fireEvent.click(within(details).getByRole("tab", { name: "Original Posting" }));

    expect(within(details).getByText("Build thoughtful product workflows.")).toBeInTheDocument();
    expect(
      within(details).queryByText("No structured summary available yet.", { exact: false }),
    ).not.toBeInTheDocument();
  });

  it("does not delete the job when confirmation is canceled", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<JobsPageClient />);

    fireEvent.click(await screen.findByTestId("job-row"));
    fireEvent.click(
      within(screen.getByTestId("job-details")).getByRole("button", { name: "Delete job" }),
    );

    expect(confirmSpy).toHaveBeenCalledWith("Delete this job? This cannot be undone.");
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/jobs/job-1",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(screen.getByText("Product Engineer")).toBeInTheDocument();
    expect(screen.getByTestId("job-details")).toBeInTheDocument();
  });

  it("deletes the job and removes the expanded row after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<JobsPageClient />);

    fireEvent.click(await screen.findByTestId("job-row"));
    fireEvent.click(
      within(screen.getByTestId("job-details")).getByRole("button", { name: "Delete job" }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/jobs/job-1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    await waitFor(() => {
      expect(screen.queryByText("Product Engineer")).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId("job-details")).not.toBeInTheDocument();
    expect(screen.getByText("No jobs yet. Import one to get started.")).toBeInTheDocument();
  });

  it("shows a visible error when delete fails", async () => {
    deleteShouldFail = true;
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<JobsPageClient />);

    fireEvent.click(await screen.findByTestId("job-row"));
    fireEvent.click(
      within(screen.getByTestId("job-details")).getByRole("button", { name: "Delete job" }),
    );

    expect(await screen.findByText("Unable to delete job.")).toBeInTheDocument();
    expect(screen.getByText("Product Engineer")).toBeInTheDocument();
  });

  it("tailors a resume from the expanded job details panel", async () => {
    render(<JobsPageClient />);

    fireEvent.click(await screen.findByTestId("job-row"));

    const tabRow = screen.getByTestId("job-details-tab-row");
    expect(within(tabRow).getByRole("tab", { name: "Structured View" })).toBeInTheDocument();
    expect(within(tabRow).getByRole("tab", { name: "Original Posting" })).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: "Apply" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Maybe" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ignore" })).not.toBeInTheDocument();

    fireEvent.click(within(tabRow).getByRole("button", { name: "Tailor Resume" }));

    const submitButton = await screen.findByRole("button", { name: "Generate Tailored Resume" });
    expect(submitButton).toBeDisabled();

    await screen.findByRole("option", { name: "No Current Resume" });
    const select = screen.getByLabelText("Resume profile");

    fireEvent.change(select, {
      target: {
        value: "profile-empty",
      },
    });
    expect(submitButton).toBeDisabled();

    fireEvent.change(select, {
      target: {
        value: "profile-current",
      },
    });
    expect(submitButton).toBeEnabled();

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/resume-profiles/profile-current/tailored-resumes",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            jobId: "job-1",
            sourceResumeVersionId: "version-1",
          }),
        }),
      );
    });

    expect(await screen.findByText(/Tailored resume created/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View resumes" })).toHaveAttribute("href", "/resumes");
    expect(
      screen.queryByText(/profile-tailored|version-tailored|suggestion-1/),
    ).not.toBeInTheDocument();
  });
});
