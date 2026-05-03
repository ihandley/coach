import { describe, expect, it, vi } from "vitest";

const importJobFromUrlMock = vi.fn();

vi.mock("@coach/db", () => ({
  createDbJobTracker: vi.fn(() => ({
    listJobs: vi.fn(),
    getJobById: vi.fn(),
    getDashboardSummary: vi.fn(),
    createJob: vi.fn(),
  })),
  createDbJobImporter: vi.fn(() => ({
    importJobFromUrl: importJobFromUrlMock,
  })),
}));

describe("server/jobs.importJobFromUrl", () => {
  it("delegates to the db job importer", async () => {
    const { importJobFromUrl } = await import("./jobs");

    importJobFromUrlMock.mockResolvedValueOnce({
      id: "job-123",
      company: "Acme",
      title: "Backend Engineer",
      sourceUrl: "https://example.com/jobs/123",
      sourceText: "Build APIs",
      status: "saved",
    });

    const result = await importJobFromUrl("https://example.com/jobs/123", {
      fetchPage: async (url: string) => ({
        url,
        html: "<html></html>",
      }),
      extractJob: async () => ({
        company: "Acme",
        title: "Backend Engineer",
        rawDescription: "Build APIs",
      }),
    });

    expect(importJobFromUrlMock).toHaveBeenCalledWith("https://example.com/jobs/123");

    expect(result).toEqual({
      id: "job-123",
      company: "Acme",
      title: "Backend Engineer",
      sourceUrl: "https://example.com/jobs/123",
      sourceText: "Build APIs",
      status: "saved",
    });
  });
});
