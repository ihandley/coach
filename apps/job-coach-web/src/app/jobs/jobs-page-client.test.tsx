import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { JOB_STATUSES } from "@coach/core/jobs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { JobsPageClient } from "./jobs-page-client";

const routerRefresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));

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

function getStatusFilterButtonNames() {
  return within(screen.getByLabelText("Job status filters"))
    .getAllByRole("button")
    .map((button) => button.textContent);
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
    matchDetails: {
      strengths: ["Strong TypeScript alignment"],
      gaps: ["No explicit Postgres signal"],
      reasons: ["Good keyword overlap"],
      summary: "Strong fit for product workflow work.",
      recommendation: "apply",
    },
  };

  let fetchMock: ReturnType<typeof vi.fn>;
  let deleteShouldFail: boolean;
  let companyUpdateShouldFail: boolean;

  beforeEach(() => {
    routerRefresh.mockReset();
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
          ? jsonResponse({ error: "Unable to update job details." }, { status: 500 })
          : jsonResponse({
              id: "job-1",
              company: body.company,
              title: body.title,
            });
      }

      if (/^\/api\/jobs\/[^/]+\/status$/.test(url) && init?.method === "POST") {
        const body = JSON.parse(String(init.body));

        return jsonResponse({
          id: url.split("/")[3],
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
    expect(screen.queryByText("No jobs yet")).not.toBeInTheDocument();

    shouldFail = false;
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Product Engineer")).toBeInTheDocument();
  });

  it("renders score states without marking recently seeded jobs as NEW", async () => {
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
    expect(screen.queryByText("NEW")).not.toBeInTheDocument();

    const titleCell = screen.getByText("Recently Imported").closest("td");
    expect(titleCell).not.toBeNull();
    expect(within(titleCell as HTMLElement).queryByText("NEW")).not.toBeInTheDocument();
  });

  it("marks only the imported job as NEW and moves it to the top by default", async () => {
    const seededRecentJob = {
      ...rankedJob,
      id: "job-recent-seeded",
      title: "Seeded Recent Job",
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      score: null,
    };
    const importedJob = {
      ...rankedJob,
      id: "job-new",
      title: "Imported Job",
      company: "Imported Co",
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      score: null,
    };
    let rankedLoadCount = 0;

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();

      if (url === "/api/jobs/ranked") {
        rankedLoadCount += 1;

        return rankedLoadCount === 1
          ? jsonResponse([seededRecentJob, rankedJob])
          : jsonResponse([seededRecentJob, rankedJob, importedJob]);
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

      return jsonResponse({ error: `Unhandled request: ${url}` }, { status: 500 });
    });

    render(<JobsPageClient />);

    expect(await screen.findByText("Seeded Recent Job")).toBeInTheDocument();
    expect(screen.queryByText("NEW")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Paste job URL"), {
      target: {
        value: "https://example.com/imported-job",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Import" }));

    expect(await screen.findByText("Job imported successfully.")).toBeInTheDocument();

    const rows = screen.getAllByTestId("job-row");
    expect(within(rows[0]).getByText("Imported Job")).toBeInTheDocument();
    expect(within(rows[0]).getByText("NEW")).toBeInTheDocument();
    expect(screen.getAllByText("NEW")).toHaveLength(1);

    const seededRecentRow = screen.getByText("Seeded Recent Job").closest("tr");
    expect(seededRecentRow).not.toBeNull();
    expect(within(seededRecentRow as HTMLElement).queryByText("NEW")).not.toBeInTheDocument();
  });

  it("renders readable created and updated dates instead of raw timestamps", async () => {
    render(<JobsPageClient />);

    expect(await screen.findByText("Product Engineer")).toBeInTheDocument();
    expect(screen.getByText("Apr 26, 2026")).toBeInTheDocument();
    expect(screen.getByText("Apr 25, 2026")).toBeInTheDocument();
    expect(screen.queryByText("2026-04-26T12:00:00.000Z")).not.toBeInTheDocument();
    expect(screen.queryByText("2026-04-25T12:00:00.000Z")).not.toBeInTheDocument();
  });

  it("focuses the import URL input and does not render selection checkboxes", async () => {
    render(<JobsPageClient />);

    const importInput = screen.getByPlaceholderText("Paste job URL");

    expect(importInput).toHaveFocus();
    expect(await screen.findByText("Product Engineer")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Select all visible jobs")).not.toBeInTheDocument();
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

  it("renders company as plain table text without inline edit affordances", async () => {
    render(<JobsPageClient />);

    expect(await screen.findByText("Pattern")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit company for Product Engineer" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Company for Product Engineer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("job-details")).not.toBeInTheDocument();
  });

  it("edits job details from the expanded action menu", async () => {
    render(<JobsPageClient />);

    fireEvent.click(await screen.findByTestId("job-row"));
    fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit Details" }));

    const companyInput = screen.getByLabelText("Company");
    const titleInput = screen.getByLabelText("Title");

    fireEvent.change(companyInput, {
      target: {
        value: "Pattern Labs",
      },
    });
    fireEvent.change(titleInput, {
      target: {
        value: "Principal Product Engineer",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/jobs/job-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            company: "Pattern Labs",
            title: "Principal Product Engineer",
          }),
        }),
      );
    });

    expect(await screen.findByText("Pattern Labs")).toBeInTheDocument();
    expect(screen.getByText("Principal Product Engineer")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Edit Details" })).not.toBeInTheDocument();
  });

  it("keeps core status chips visible and hides optional zero-count chips", async () => {
    render(<JobsPageClient />);

    expect(await screen.findByText("Product Engineer")).toBeInTheDocument();

    expect(getStatusFilterButtonNames()).toEqual([
      "All (1)",
      "Saved (1)",
      "Applying (0)",
      "Applied (0)",
      "Interviewing (0)",
    ]);

    expect(screen.queryByRole("button", { name: "Researching (0)" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Offer (0)" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rejected (0)" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Withdrawn (0)" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Archived (0)" })).not.toBeInTheDocument();
  });

  it("shows optional status chips when they have jobs and preserves lifecycle order", async () => {
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

    expect(getStatusFilterButtonNames()).toEqual([
      `All (${JOB_STATUSES.length})`,
      "Saved (1)",
      "Researching (1)",
      "Applying (1)",
      "Applied (1)",
      "Interviewing (1)",
      "Offer (1)",
      "Rejected (1)",
      "Withdrawn (1)",
      "Archived (1)",
    ]);

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
    expect(screen.queryByRole("button", { name: "Archived (0)" })).not.toBeInTheDocument();
  });

  it("resets to All when the only remaining visible filter becomes hidden", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();

      if (url === "/api/jobs/ranked") {
        return jsonResponse([
          {
            ...rankedJob,
            status: "archived",
          },
        ]);
      }

      if (/^\/api\/jobs\/[^/]+\/status$/.test(url) && init?.method === "POST") {
        const body = JSON.parse(String(init.body));

        return jsonResponse({
          id: url.split("/")[3],
          status: body.status,
        });
      }

      return jsonResponse({ error: `Unhandled request: ${url}` }, { status: 500 });
    });

    render(<JobsPageClient />);

    expect(await screen.findByText("Product Engineer")).toBeInTheDocument();

    for (const chipName of ["Saved (0)", "Applying (0)", "Applied (0)", "Interviewing (0)"]) {
      fireEvent.click(screen.getByRole("button", { name: chipName }));
    }

    fireEvent.click(screen.getByRole("button", { name: "Edit job status" }));
    fireEvent.click(screen.getByRole("button", { name: "Applied" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "All (1)" })).toHaveClass("border-blue-600");
    });

    expect(screen.queryByRole("button", { name: "Archived (0)" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Applied (1)" })).toBeInTheDocument();
    expect(screen.getByText("Product Engineer")).toBeInTheDocument();
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

  it("shows job actions only inside the expanded action menu", async () => {
    render(<JobsPageClient />);

    expect(await screen.findByText("Product Engineer")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Actions" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Delete Job" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("job-row"));

    const details = screen.getByTestId("job-details");
    expect(within(details).getByRole("button", { name: "Actions" })).toBeInTheDocument();
    expect(within(details).queryByRole("menuitem", { name: "Delete Job" })).not.toBeInTheDocument();

    fireEvent.click(within(details).getByRole("button", { name: "Actions" }));

    expect(
      within(details).getByRole("menuitem", { name: "Generate Tailored Resume" }),
    ).toBeInTheDocument();
    expect(within(details).getByRole("menuitem", { name: "Edit Details" })).toBeInTheDocument();
    expect(
      within(details).getByRole("menuitem", { name: "Re-import from URL" }),
    ).toBeInTheDocument();
    expect(within(details).getByRole("menuitem", { name: "Delete Job" })).toBeInTheDocument();
  });

  it("renders structured and original posting details with expanded-card controls", async () => {
    render(<JobsPageClient />);

    fireEvent.click(await screen.findByTestId("job-row"));

    const details = screen.getByTestId("job-details");

    expect(within(details).getByRole("button", { name: "Actions" })).toBeInTheDocument();
    expect(within(details).getByRole("tab", { name: "Structured View" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(within(details).getByRole("tab", { name: "Original Posting" })).toBeInTheDocument();
    expect(within(details).getByRole("tab", { name: "Match Details" })).toBeInTheDocument();
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
      within(details).queryByText("Structured data not available", { exact: false }),
    ).not.toBeInTheDocument();

    fireEvent.click(within(details).getByRole("tab", { name: "Match Details" }));

    expect(within(details).getByText("Match score: 82%")).toBeInTheDocument();
    expect(within(details).getByText("Strong fit for product workflow work.")).toBeInTheDocument();
    expect(within(details).getByText("Strengths")).toBeInTheDocument();
    expect(within(details).getByText("Strong TypeScript alignment")).toBeInTheDocument();
    expect(within(details).getByText("Gaps")).toBeInTheDocument();
    expect(within(details).getByText("No explicit Postgres signal")).toBeInTheDocument();
    expect(within(details).getByText("Match Reasoning")).toBeInTheDocument();
    expect(within(details).getByText("Good keyword overlap")).toBeInTheDocument();
    expect(
      within(details).queryByText("Build thoughtful product workflows."),
    ).not.toBeInTheDocument();
  });

  it("shows fallback copy when structured data or match analysis is missing", async () => {
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = input.toString();

      if (url === "/api/jobs/ranked") {
        return jsonResponse([
          {
            ...rankedJob,
            score: null,
            matchDetails: null,
            structuredSummary: null,
          },
        ]);
      }

      return jsonResponse({ error: `Unhandled request: ${url}` }, { status: 500 });
    });

    render(<JobsPageClient />);

    fireEvent.click(await screen.findByTestId("job-row"));

    const details = screen.getByTestId("job-details");
    expect(within(details).getByText("Structured data not available")).toBeInTheDocument();

    fireEvent.click(within(details).getByRole("tab", { name: "Match Details" }));

    expect(within(details).getByText("No match analysis available")).toBeInTheDocument();
  });

  it("does not delete the job when confirmation is canceled", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<JobsPageClient />);

    fireEvent.click(await screen.findByTestId("job-row"));
    fireEvent.click(
      within(screen.getByTestId("job-details")).getByRole("button", { name: "Actions" }),
    );
    fireEvent.click(
      within(screen.getByTestId("job-details")).getByRole("menuitem", { name: "Delete Job" }),
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
      within(screen.getByTestId("job-details")).getByRole("button", { name: "Actions" }),
    );
    fireEvent.click(
      within(screen.getByTestId("job-details")).getByRole("menuitem", { name: "Delete Job" }),
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
    expect(screen.getByText("No jobs yet")).toBeInTheDocument();
    expect(
      screen.getByText("Paste a job posting URL above to import your first opportunity."),
    ).toBeInTheDocument();
  });

  it("shows a visible error when delete fails", async () => {
    deleteShouldFail = true;
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(<JobsPageClient />);

    fireEvent.click(await screen.findByTestId("job-row"));
    fireEvent.click(
      within(screen.getByTestId("job-details")).getByRole("button", { name: "Actions" }),
    );
    fireEvent.click(
      within(screen.getByTestId("job-details")).getByRole("menuitem", { name: "Delete Job" }),
    );

    expect(await screen.findByText("Unable to delete job.")).toBeInTheDocument();
    expect(screen.getByText("Product Engineer")).toBeInTheDocument();
  });

  it("tailors a resume from the expanded action menu modal", async () => {
    render(<JobsPageClient />);

    fireEvent.click(await screen.findByTestId("job-row"));

    const details = screen.getByTestId("job-details");
    const tabRow = screen.getByTestId("job-details-tab-row");
    expect(within(tabRow).getByRole("tab", { name: "Structured View" })).toBeInTheDocument();
    expect(within(tabRow).getByRole("tab", { name: "Original Posting" })).toBeInTheDocument();
    expect(within(tabRow).getByRole("tab", { name: "Match Details" })).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: "Apply" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Maybe" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ignore" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Resume profile")).not.toBeInTheDocument();

    fireEvent.click(within(details).getByRole("button", { name: "Actions" }));
    fireEvent.click(within(details).getByRole("menuitem", { name: "Generate Tailored Resume" }));

    expect(
      await screen.findByRole("dialog", { name: "Generate tailored resume" }),
    ).toBeInTheDocument();
    const submitButton = await screen.findByRole("button", { name: "Generate Tailored Resume" });
    await screen.findByRole("option", { name: "No Current Resume" });
    const select = screen.getByLabelText("Resume profile");
    expect(select).toHaveValue("profile-current");
    expect(submitButton).toBeEnabled();

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
