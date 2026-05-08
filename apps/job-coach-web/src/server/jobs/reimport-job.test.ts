process.env.SUPABASE_URL = "http://127.0.0.1:54321";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

import { beforeEach, describe, expect, it, vi } from "vitest";

const getJobById = vi.fn();
const fetchJobPageAsDependency = vi.fn();
const extractJobStub = vi.fn();
const generateStructuredSummary = vi.fn();
const normalizedResumeToText = vi.fn();
const from = vi.fn();

vi.mock("@coach/ai", async () => {
  const actual = await vi.importActual<object>("@coach/ai");

  return {
    ...actual,
    fetchJobPageAsDependency,
    extractJobStub,
  };
});

vi.mock("@coach/db", async () => {
  const actual = await vi.importActual<object>("@coach/db");

  class MockDbJobRepository {
    getJobById = getJobById;
  }

  return {
    ...actual,
    createServerClient: vi.fn(() => ({ from })),
    DbJobRepository: MockDbJobRepository,
  };
});

vi.mock("@/server/ai/structured-job-summary", () => ({
  generateStructuredSummary,
}));

vi.mock("@/server/match/normalized-resume-to-text", () => ({
  normalizedResumeToText,
}));

function currentJob(overrides: Record<string, unknown> = {}) {
  return {
    id: "job-123",
    company: "Current Co",
    title: "Current Title",
    sourceUrl: "https://example.com/jobs/123",
    sourceText: "Current source text",
    structuredSummary: { current: true },
    status: "interviewing",
    createdAt: "2026-04-20T10:00:00.000Z",
    updatedAt: "2026-04-23T10:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  getJobById.mockReset();
  fetchJobPageAsDependency.mockReset();
  extractJobStub.mockReset();
  generateStructuredSummary.mockReset();
  normalizedResumeToText.mockReset();
  from.mockReset();
  vi.resetModules();
});

describe("previewJobReimport", () => {
  it("returns current and preview data without mutating the database", async () => {
    const structuredSummary = { preview: true };

    getJobById.mockResolvedValue(currentJob());
    fetchJobPageAsDependency.mockResolvedValue({
      url: "https://example.com/jobs/123",
      html: "<html>Latest job page</html>",
    });
    extractJobStub.mockResolvedValue({
      company: "Preview Co",
      title: "Preview Title",
      rawDescription: "Latest text\n\nReport this job",
    });
    generateStructuredSummary.mockResolvedValue(structuredSummary);

    const { previewJobReimport } = await import("./reimport-job");

    const result = await previewJobReimport("job-123");

    expect(result).toEqual({
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
        sourceText: "Latest text",
        structuredSummary,
      },
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects placeholder source URLs before fetch", async () => {
    getJobById.mockResolvedValue(currentJob({ sourceUrl: "import://manual/job-123" }));

    const { previewJobReimport } = await import("./reimport-job");

    await expect(previewJobReimport("job-123")).rejects.toMatchObject({
      code: "INVALID_SOURCE_URL",
      status: 400,
    });
    expect(fetchJobPageAsDependency).not.toHaveBeenCalled();
  });

  it("maps fetch failures to a preview error", async () => {
    const error = new Error("failed");
    error.name = "FetchJobPageError";

    getJobById.mockResolvedValue(currentJob());
    fetchJobPageAsDependency.mockRejectedValue(error);

    const { previewJobReimport } = await import("./reimport-job");

    await expect(previewJobReimport("job-123")).rejects.toMatchObject({
      code: "FAILED_TO_FETCH_JOB_PAGE",
      status: 400,
    });
  });
});

describe("applyJobReimport", () => {
  it("updates re-imported fields, preserves status, and upserts a match", async () => {
    const update = vi.fn().mockReturnThis();
    const eq = vi.fn().mockReturnThis();
    const select = vi.fn().mockReturnThis();
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "job-123",
        company: "Edited Co",
        title: "Edited Title",
        source_url: "https://example.com/jobs/123",
        source_text: "Edited source text TypeScript",
        structured_summary: { edited: true },
        status: "interviewing",
        created_at: "2026-04-20T10:00:00.000Z",
        updated_at: "2026-04-24T10:00:00.000Z",
      },
      error: null,
    });
    const maybeSingleProfile = vi.fn().mockResolvedValue({
      data: {
        id: "profile-1",
        normalized_resume: { summary: "TypeScript resume" },
        created_at: "2026-04-01T10:00:00.000Z",
      },
      error: null,
    });
    const profileQuery = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: maybeSingleProfile,
    };
    const upsert = vi.fn().mockResolvedValue({ error: null });

    getJobById.mockResolvedValue(currentJob());
    normalizedResumeToText.mockReturnValue("TypeScript product engineering");
    from.mockImplementation((table: string) => {
      if (table === "jobs") {
        return { update, eq, select, single };
      }

      if (table === "resume_profiles") {
        return profileQuery;
      }

      if (table === "job_matches") {
        return { upsert };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const { applyJobReimport } = await import("./reimport-job");

    const result = await applyJobReimport({
      jobId: "job-123",
      company: " Edited Co ",
      title: " Edited Title ",
      sourceText: " Edited source text TypeScript ",
      structuredSummary: { edited: true },
      resumeProfileId: "default",
    });

    expect(update).toHaveBeenCalledWith({
      company: "Edited Co",
      title: "Edited Title",
      source_url: "https://example.com/jobs/123",
      source_text: "Edited source text TypeScript",
      structured_summary: { edited: true },
      updated_at: expect.any(String),
    });
    expect(update.mock.calls[0][0]).not.toHaveProperty("status");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        job_id: "job-123",
        resume_profile_id: "profile-1",
        score: expect.any(Number),
      }),
    );
    expect(result.job).toMatchObject({
      id: "job-123",
      company: "Edited Co",
      title: "Edited Title",
      status: "interviewing",
      structuredSummary: { edited: true },
    });
  });

  it("validates required editable fields", async () => {
    const { applyJobReimport } = await import("./reimport-job");

    await expect(
      applyJobReimport({
        jobId: "job-123",
        company: "",
        title: "Title",
        sourceText: "Text",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_REIMPORT_INPUT",
      status: 400,
    });
    expect(getJobById).not.toHaveBeenCalled();
  });
});
