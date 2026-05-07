import { beforeEach, describe, expect, it, vi } from "vitest";

const previewJobReimport = vi.fn();

vi.mock("@/server/jobs/reimport-job", async () => {
  const actual = await vi.importActual<typeof import("@/server/jobs/reimport-job")>(
    "@/server/jobs/reimport-job",
  );

  return {
    ...actual,
    previewJobReimport,
  };
});

beforeEach(() => {
  previewJobReimport.mockReset();
  vi.resetModules();
});

describe("POST /api/jobs/[jobId]/reimport/preview", () => {
  it("returns re-import preview data without applying it", async () => {
    previewJobReimport.mockResolvedValue({
      jobId: "job-123",
      sourceUrl: "https://example.com/jobs/123",
      current: {
        company: "Current Co",
        title: "Current Title",
        sourceText: "Current source text",
        structuredSummary: { current: true },
      },
      preview: {
        company: "Preview Co",
        title: "Preview Title",
        sourceText: "Preview source text",
        structuredSummary: { preview: true },
      },
    });

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/jobs/job-123/reimport/preview", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      {
        params: Promise.resolve({ jobId: "job-123" }),
      },
    );

    expect(response.status).toBe(200);
    expect(previewJobReimport).toHaveBeenCalledWith("job-123", undefined);
    await expect(response.json()).resolves.toMatchObject({
      current: {
        company: "Current Co",
      },
      preview: {
        company: "Preview Co",
      },
    });
  });
});
