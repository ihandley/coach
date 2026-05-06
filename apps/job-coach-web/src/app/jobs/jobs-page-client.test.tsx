import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { JOB_STATUSES } from "@coach/core/jobs";
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

function getStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
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
  let companyUpdateShouldFail: boolean;

  beforeEach(() => {
    deleteShouldFail = false;
    companyUpdateShouldFail = false;

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

      if (url === "/api/jobs/job-1" && init?.method === "PATCH") {
        const body = JSON.parse(String(init.body));

        return companyUpdateShouldFail
          ? jsonResponse({ error: "Unable to update company." }, { status: 500 })
          : jsonResponse({
              id: "job-1",
              company: body.company,
            });
      }

      if (url === "/api/jobs/job-1/status" && init?.method === "POST") {
        const body = JSON.parse(String(init.body));

        return jsonResponse({
          id: "job-1",
          status: body.status,
        });
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

  it("shows skeleton rows while ranked jobs load", async () => {
    render(<JobsPageClient />);

    expect(screen.getByRole("status", { name: "Loading jobs" })).toBeInTheDocument();
    expect(await screen.findByText("Product Engineer")).toBeInTheDocument();
  });

  it("shows a retryable error state when ranked jobs fail to load", async () => {
    let shouldFail = true;
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url === "/api/jobs/ranked") {
        return shouldFail
          ? jsonResponse({ error: "Ranked jobs unavailable." }, { status: 500 })
          : jsonResponse([rankedJob]);
      }

      return jsonResponse({ error: `Unhandled request: ${url}` }, { status: 500 });
    });

    render(<JobsPageClient />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Ranked jobs unavailable.");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.queryByText("No jobs yet. Import one to get started.")).not.toBeInTheDocument();

    shouldFail = false;
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Product Engineer")).toBeInTheDocument();
  });

  it("renders score states, NEW badges, and the default sort label", async () => {
    const recentlyCreatedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const olderCreatedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url === "/api/jobs/ranked") {
        return jsonResponse([
          {
            ...rankedJob,
            id: "job-unmatched",
            title: "Recently Imported",
            createdAt: recentlyCreatedAt,
            updatedAt: recentlyCreatedAt,
            score: null,
          },
          {
            ...rankedJob,
            id: "job-high",
            title: "Strong Match",
            createdAt: olderCreatedAt,
            updatedAt: olderCreatedAt,
            score: 0.82,
          },
          {
            ...rankedJob,
            id: "job-zero",
            title: "Explicit Zero Match",
            createdAt: olderCreatedAt,
            updatedAt: olderCreatedAt,
            score: 0,
          },
        ]);
      }

      return jsonResponse({ error: `Unhandled request: ${url}` }, { status: 500 });
    });

    render(<JobsPageClient />);

    expect(await screen.findByText("Recently Imported")).toBeInTheDocument();
    expect(screen.getByText("Not matched")).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: "Match score 82%" })).toBeInTheDocument();
    expect(screen.getByRole("meter", { name: "Match score 0%" })).toBeInTheDocument();
    expect(screen.getAllByRole("meter")).toHaveLength(2);
    expect(
      screen.getByText("Default sort: NEW jobs first, then matched jobs by score."),
    ).toBeInTheDocument();

    const titleCell = screen.getByText("Recently Imported").closest("td");
    expect(titleCell).not.toBeNull();
    expect(within(titleCell as HTMLElement).getByText("NEW")).toBeInTheDocument();
  });

  it("renders readable created and updated dates instead of raw timestamps", async () => {
    render(<JobsPageClient />);

    expect(await screen.findByText("Product Engineer")).toBeInTheDocument();
    expect(screen.getByText("Apr 26, 2026")).toBeInTheDocument();
    expect(screen.getByText("Apr 25, 2026")).toBeInTheDocument();
    expect(screen.queryByText("2026-04-26T12:00:00.000Z")).not.toBeInTheDocument();
    expect(screen.queryByText("2026-04-25T12:00:00.000Z")).not.toBeInTheDocument();
  });

  it("renders missing and invalid dates gracefully", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url === "/api/jobs/ranked") {
        return jsonResponse([
          {
            ...rankedJob,
            id: "job-invalid-dates",
            title: "Invalid Dates",
            createdAt: "not-a-date",
            updatedAt: "also-not-a-date",
          },
          {
            ...rankedJob,
            id: "job-missing-dates",
            title: "Missing Dates",
            createdAt: null,
            updatedAt: undefined,
          },
        ]);
      }

      return jsonResponse({ error: `Unhandled request: ${url}` }, { status: 500 });
    });

    render(<JobsPageClient />);

    expect(await screen.findByText("Invalid Dates")).toBeInTheDocument();
    expect(screen.getByText("Missing Dates")).toBeInTheDocument();
    expect(screen.getAllByText("Not set")).toHaveLength(4);
    expect(screen.queryByText("not-a-date")).not.toBeInTheDocument();
    expect(screen.queryByText("also-not-a-date")).not.toBeInTheDocument();
  });

  it("edits the company inline without expanding the job row", async () => {
    render(<JobsPageClient />);

    expect(await screen.findByText("Pattern")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit company for Product Engineer" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit company for Product Engineer" }));

    expect(screen.queryByTestId("job-details")).not.toBeInTheDocument();

    const companyInput = screen.getByLabelText("Company for Product Engineer");
    fireEvent.change(companyInput, {
      target: {
        value: "Pattern Labs",
      },
    });
    fireEvent.keyDown(companyInput, { key: "Enter" });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/jobs/job-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ company: "Pattern Labs" }),
        }),
      );
    });

    expect(await screen.findByText("Pattern Labs")).toBeInTheDocument();
    expect(screen.queryByText("Pattern")).not.toBeInTheDocument();
    expect(screen.queryByTestId("job-details")).not.toBeInTheDocument();
  });

  it("saves company edits on blur and reverts on failure", async () => {
    companyUpdateShouldFail = true;
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<JobsPageClient />);

    expect(await screen.findByText("Pattern")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit company for Product Engineer" }));

    const companyInput = screen.getByLabelText("Company for Product Engineer");
    fireEvent.change(companyInput, {
      target: {
        value: "Pattern Labs",
      },
    });
    fireEvent.blur(companyInput);

    expect(await screen.findByText("Unable to update company.")).toBeInTheDocument();
    expect(screen.getByText("Pattern")).toBeInTheDocument();
    expect(screen.queryByText("Pattern Labs")).not.toBeInTheDocument();
  });

  it("cancels company edits on escape", async () => {
    render(<JobsPageClient />);

    expect(await screen.findByText("Pattern")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit company for Product Engineer" }));

    const companyInput = screen.getByLabelText("Company for Product Engineer");
    fireEvent.change(companyInput, {
      target: {
        value: "Pattern Labs",
      },
    });
    fireEvent.keyDown(companyInput, { key: "Escape" });

    expect(screen.getByText("Pattern")).toBeInTheDocument();
    expect(screen.queryByText("Pattern Labs")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/jobs/job-1",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("includes every current status in the default All status view", async () => {
    const jobs = JOB_STATUSES.map((status, index) => ({
      ...rankedJob,
      id: `job-${status}`,
      title: status === "archived" ? "Remi" : `${getStatusLabel(status)} Role`,
      status,
      createdAt: `2026-04-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`,
      updatedAt: `2026-04-${String(index + 1).padStart(2, "0")}T12:00:00.000Z`,
    }));

    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url === "/api/jobs/ranked") {
        return jsonResponse(jobs);
      }

      return jsonResponse({ error: `Unhandled request: ${url}` }, { status: 500 });
    });

    render(<JobsPageClient />);

    expect(await screen.findByText("Remi")).toBeInTheDocument();
    const renderedRowCount = screen.getAllByTestId("job-row").length;

    expect(screen.getByRole("button", { name: `All (${JOB_STATUSES.length})` })).toHaveClass(
      "border-blue-600",
      "bg-blue-50",
      "text-blue-700",
    );
    expect(renderedRowCount).toBe(JOB_STATUSES.length);

    const individualChipTotal = JOB_STATUSES.reduce((sum, status) => {
      expect(
        screen.getByRole("button", { name: `${getStatusLabel(status)} (1)` }),
      ).toBeInTheDocument();
      return sum + 1;
    }, 0);

    expect(individualChipTotal).toBe(renderedRowCount);

    const archivedChip = screen.getByRole("button", { name: "Archived (1)" });
    expect(archivedChip).toHaveClass("border-gray-500", "bg-gray-100", "text-gray-700");

    const remiRow = screen.getByText("Remi").closest("tr");
    expect(remiRow).not.toBeNull();
    expect(within(remiRow as HTMLElement).getByTestId("job-status")).toHaveClass(
      "bg-gray-200",
      "text-gray-600",
    );

    fireEvent.click(archivedChip);
    expect(screen.queryByText("Remi")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("job-row")).toHaveLength(JOB_STATUSES.length - 1);

    fireEvent.click(screen.getByRole("button", { name: `All (${JOB_STATUSES.length})` }));
    expect(screen.getByText("Remi")).toBeInTheDocument();
    expect(screen.getAllByTestId("job-row")).toHaveLength(JOB_STATUSES.length);
  });

  it("keeps status chip counts synced after a popover status update", async () => {
    render(<JobsPageClient />);

    expect(await screen.findByText("Product Engineer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saved (1)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Applied (0)" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit job status" }));
    fireEvent.click(screen.getByRole("button", { name: "Applied" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/jobs/job-1/status",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ status: "applied" }),
        }),
      );
    });

    expect(screen.getByRole("button", { name: "Saved (0)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Applied (1)" })).toBeInTheDocument();
  });

  it("preserves row expand and collapse after interacting with table controls", async () => {
    render(<JobsPageClient />);

    const row = await screen.findByTestId("job-row");

    fireEvent.click(screen.getByRole("button", { name: "Edit job status" }));
    expect(screen.queryByTestId("job-details")).not.toBeInTheDocument();

    fireEvent.click(row);
    expect(screen.getByTestId("job-details")).toBeInTheDocument();

    fireEvent.click(row);
    expect(screen.queryByTestId("job-details")).not.toBeInTheDocument();
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
