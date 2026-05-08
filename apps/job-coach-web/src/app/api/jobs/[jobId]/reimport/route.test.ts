import { beforeEach, describe, expect, it, vi } from "vitest";

const applyJobReimport = vi.fn();

vi.mock("@/server/jobs/reimport-job", async () => {
  const actual = await vi.importActual<typeof import("@/server/jobs/reimport-job")>(
    "@/server/jobs/reimport-job",
  );

  return {
    ...actual,
    applyJobReimport,
  };
});

beforeEach(() => {
  applyJobReimport.mockReset();
  vi.resetModules();
});

describe("PATCH /api/jobs/[jobId]/reimport", () => {
  it("applies reviewed re-import data", async () => {
    applyJobReimport.mockResolvedValue({
      job: {
        id: "job-123",
        company: "Edited Co",
        title: "Edited Title",
      },
      match: {
        score: 0.78,
      },
    });

    const { PATCH } = await import("./route");

    const response = await PATCH(
      new Request("http://localhost/api/jobs/job-123/reimport", {
        method: "PATCH",
        body: JSON.stringify({
          company: "Edited Co",
          title: "Edited Title",
          sourceText: "Edited source text",
          structuredSummary: { edited: true },
          resumeProfileId: "default",
        }),
      }),
      {
        params: Promise.resolve({ jobId: "job-123" }),
      },
    );

    expect(response.status).toBe(200);
    expect(applyJobReimport).toHaveBeenCalledWith({
      jobId: "job-123",
      company: "Edited Co",
      title: "Edited Title",
      sourceText: "Edited source text",
      structuredSummary: { edited: true },
      sourceUrl: undefined,
      resumeProfileId: "default",
    });
    await expect(response.json()).resolves.toMatchObject({
      job: {
        id: "job-123",
        company: "Edited Co",
      },
      match: {
        score: 0.78,
      },
    });
  });
});
