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

  it("loads preview data, lets the user edit it, and saves explicitly", async () => {
    render(<ReimportJobPanel jobId="job-123" sourceUrl="https://example.com/jobs/123" />);

    fireEvent.click(screen.getByRole("button", { name: "Re-import from URL" }));

    expect(await screen.findByRole("dialog", { name: "Re-import from URL" })).toBeInTheDocument();
    const company = await screen.findByLabelText("Company");
    expect(company).toHaveValue("Preview Co");
    expect(screen.getByLabelText("Title")).toHaveValue("Preview Title");
    expect(screen.getByLabelText("Raw View")).toHaveValue("Preview source text");
    expect(screen.queryByLabelText("Structured View")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Advanced Structured Data" }));

    expect(screen.getByLabelText("Structured View")).toHaveValue(
      JSON.stringify({ requirements: ["TypeScript"] }, null, 2),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.change(company, { target: { value: "Edited Co" } });
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Edited Title" } });
    fireEvent.change(screen.getByLabelText("Raw View"), {
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

    expect(await screen.findByLabelText("Company")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog", { name: "Re-import from URL" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Company")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("closes the drawer without saving changes", async () => {
    render(<ReimportJobPanel jobId="job-123" sourceUrl="https://example.com/jobs/123" />);

    fireEvent.click(screen.getByRole("button", { name: "Re-import from URL" }));

    expect(await screen.findByRole("dialog", { name: "Re-import from URL" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog", { name: "Re-import from URL" })).not.toBeInTheDocument();
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
