import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ReimportJobPanel } from "./reimport-job-panel";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
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

describe("ReimportJobPanel", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    refresh.mockReset();
    fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();

      if (url === "/api/jobs/job-123/reimport/preview" && init?.method === "POST") {
        return jsonResponse({
          sourceUrl: "https://example.com/jobs/123",
          current: {
            company: "Current Co",
            title: "Current Title",
            sourceText: "Current source text",
            structuredSummary: {
              current: true,
            },
          },
          preview: {
            company: "Preview Co",
            title: "Preview Title",
            sourceText: "Preview source text",
            structuredSummary: {
              requirements: ["TypeScript"],
            },
          },
        });
      }

      if (url === "/api/jobs/job-123/reimport" && init?.method === "PATCH") {
        return jsonResponse({
          job: {
            id: "job-123",
            company: JSON.parse(String(init.body)).company,
          },
          match: {
            score: 0.8,
          },
        });
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

  it("opens a preview modal with current, imported, and editable final values", async () => {
    render(<ReimportJobPanel jobId="job-123" sourceUrl="https://example.com/jobs/123" />);

    fireEvent.click(screen.getByRole("button", { name: "Re-import from URL" }));

    expect(
      await screen.findByRole("dialog", { name: "Review imported job data" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Current Co")).toBeInTheDocument();
    expect(screen.getByText("Current Title")).toBeInTheDocument();
    expect(screen.getByText("Preview Co")).toBeInTheDocument();
    expect(screen.getByText("Preview Title")).toBeInTheDocument();

    const company = screen.getByLabelText("Final company");
    expect(company).toHaveValue("Preview Co");
    expect(screen.getByLabelText("Final title")).toHaveValue("Preview Title");
    expect(screen.queryByLabelText("Raw posting text")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Structured summary JSON")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("resets final company and title to current values", async () => {
    render(<ReimportJobPanel jobId="job-123" sourceUrl="https://example.com/jobs/123" />);

    fireEvent.click(screen.getByRole("button", { name: "Re-import from URL" }));

    const company = await screen.findByLabelText("Final company");
    fireEvent.change(company, { target: { value: "Edited Co" } });
    fireEvent.change(screen.getByLabelText("Final title"), { target: { value: "Edited Title" } });

    fireEvent.click(screen.getByRole("button", { name: "Keep current values" }));

    expect(company).toHaveValue("Current Co");
    expect(screen.getByLabelText("Final title")).toHaveValue("Current Title");
  });

  it("lets the user edit advanced details and saves explicitly", async () => {
    render(<ReimportJobPanel jobId="job-123" sourceUrl="https://example.com/jobs/123" />);

    fireEvent.click(screen.getByRole("button", { name: "Re-import from URL" }));

    const company = await screen.findByLabelText("Final company");
    fireEvent.click(screen.getByRole("button", { name: "Advanced import details" }));

    expect(screen.getByLabelText("Raw posting text")).toHaveValue("Preview source text");

    expect(screen.getByLabelText("Structured summary JSON")).toHaveValue(
      JSON.stringify({ requirements: ["TypeScript"] }, null, 2),
    );

    fireEvent.change(company, { target: { value: "Edited Co" } });
    fireEvent.change(screen.getByLabelText("Final title"), { target: { value: "Edited Title" } });
    fireEvent.change(screen.getByLabelText("Raw posting text"), {
      target: { value: "Edited source text" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/jobs/job-123/reimport",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          company: "Edited Co",
          title: "Edited Title",
          sourceText: "Edited source text",
          structuredSummary: null,
          sourceUrl: "https://example.com/jobs/123",
          resumeProfileId: "default",
        }),
      }),
    );
    expect(screen.getByText("Job re-import saved.")).toBeInTheDocument();
  });

  it("cancels preview without saving changes", async () => {
    render(<ReimportJobPanel jobId="job-123" sourceUrl="https://example.com/jobs/123" />);

    fireEvent.click(screen.getByRole("button", { name: "Re-import from URL" }));

    expect(await screen.findByLabelText("Final company")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      screen.queryByRole("dialog", { name: "Review imported job data" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Final company")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("closes the modal without saving changes", async () => {
    render(<ReimportJobPanel jobId="job-123" sourceUrl="https://example.com/jobs/123" />);

    fireEvent.click(screen.getByRole("button", { name: "Re-import from URL" }));

    expect(
      await screen.findByRole("dialog", { name: "Review imported job data" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(
      screen.queryByRole("dialog", { name: "Review imported job data" }),
    ).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("disables placeholder source URLs and shows the explanatory message", () => {
    render(<ReimportJobPanel jobId="job-123" sourceUrl="import://manual/job-123" />);

    expect(screen.getByRole("button", { name: "Re-import from URL" })).toBeDisabled();
    expect(
      screen.getByText(
        "This job cannot be re-imported because it does not have a real source URL.",
      ),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
