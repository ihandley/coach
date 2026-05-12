import { beforeEach, describe, expect, it, vi } from "vitest";

const createTailoredResume = vi.fn();
const { createServerClientMock, backfillJobMatchesMock } = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  backfillJobMatchesMock: vi.fn(),
}));

vi.mock("@/server/resume-tailoring/create-tailored-resume-service", () => {
  return {
    createTailoredResumeService: () => createTailoredResume,
  };
});

vi.mock("@coach/db", async () => {
  const actual = await vi.importActual<typeof import("@coach/db")>("@coach/db");

  return {
    ...actual,
    createServerClient: createServerClientMock,
  };
});

vi.mock("@/server/match/backfill-job-matches", () => ({
  backfillJobMatches: backfillJobMatchesMock,
}));

describe("POST /api/resume-profiles/[id]/tailored-resumes", () => {
  beforeEach(() => {
    createTailoredResume.mockReset();
    createServerClientMock.mockReset();
    backfillJobMatchesMock.mockReset();
  });

  it("creates a tailored resume version", async () => {
    const db = {};
    createServerClientMock.mockReturnValue(db);
    backfillJobMatchesMock.mockResolvedValue({ updated: 2, resumeProfileId: "profile-2" });
    createTailoredResume.mockResolvedValue({
      version: {
        id: "version-2",
        profileId: "profile-2",
        versionNumber: 1,
        kind: "tailored",
        source: {
          kind: "tailored",
          label: "Jane Doe Resume - Pattern",
        },
        normalizedResume: {
          basics: {
            fullName: "Jane Doe",
            headline: "Software Engineer",
            summary: "Backend engineer with API and fintech integration experience.",
          },
          skills: ["TypeScript", "Node.js", "PostgreSQL"],
          experience: [
            {
              company: "Acme",
              title: "Software Engineer",
              highlights: ["Built internal APIs"],
            },
          ],
          education: [],
        },
        lineage: {
          sourceResumeVersionId: "version-1",
          sourceJobId: "job-123",
        },
      },
      tailoredResume: {
        id: "profile-2",
        name: "Jane Doe Resume - Pattern",
        profileId: "profile-2",
        versionId: "version-2",
      },
      suggestions: [
        {
          id: "suggestion-1",
          sectionTarget: "summary",
          originalContent: "old",
          suggestedContent: "new",
          rationale: "reason",
          relatedJobRequirements: ["payments"],
          priority: "high",
          confidence: "high",
        },
      ],
    });

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/resume-profiles/profile-1/tailored-resumes", {
        method: "POST",
        body: JSON.stringify({
          jobId: "job-123",
          sourceResumeVersionId: "version-1",
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
      {
        params: Promise.resolve({
          id: "profile-1",
        }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        version: expect.objectContaining({
          id: "version-2",
          profileId: "profile-2",
          versionNumber: 1,
          kind: "tailored",
          source: {
            kind: "tailored",
            label: "Jane Doe Resume - Pattern",
          },
          lineage: {
            sourceResumeVersionId: "version-1",
            sourceJobId: "job-123",
          },
        }),
        tailoredResume: {
          id: "profile-2",
          name: "Jane Doe Resume - Pattern",
          profileId: "profile-2",
          versionId: "version-2",
        },
        suggestions: expect.any(Array),
        matchRefresh: {
          updated: 2,
          resumeProfileId: "profile-2",
        },
      }),
    );
    expect(createServerClientMock).toHaveBeenCalledTimes(1);
    expect(backfillJobMatchesMock).toHaveBeenCalledWith(db);
  });

  it("returns 400 for invalid input", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/resume-profiles/profile-1/tailored-resumes", {
        method: "POST",
        body: JSON.stringify({
          jobId: "",
          sourceResumeVersionId: "version-1",
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
      {
        params: Promise.resolve({
          id: "profile-1",
        }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "INVALID_TAILORED_RESUME_INPUT",
    });
  });

  it("returns 404 when the resume profile does not exist", async () => {
    createTailoredResume.mockRejectedValue(new Error("RESUME_PROFILE_NOT_FOUND"));

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/resume-profiles/missing/tailored-resumes", {
        method: "POST",
        body: JSON.stringify({
          jobId: "job-123",
          sourceResumeVersionId: "version-1",
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
      {
        params: Promise.resolve({
          id: "missing",
        }),
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "RESUME_PROFILE_NOT_FOUND",
    });
  });

  it("returns 404 when the resume version does not exist", async () => {
    createTailoredResume.mockRejectedValue(new Error("RESUME_VERSION_NOT_FOUND"));

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/resume-profiles/profile-1/tailored-resumes", {
        method: "POST",
        body: JSON.stringify({
          jobId: "job-123",
          sourceResumeVersionId: "missing-version",
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
      {
        params: Promise.resolve({
          id: "profile-1",
        }),
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "RESUME_VERSION_NOT_FOUND",
    });
  });

  it("returns 400 when generated suggestions are malformed", async () => {
    createTailoredResume.mockRejectedValue(new Error("INVALID_TAILORING_SUGGESTIONS"));

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/resume-profiles/profile-1/tailored-resumes", {
        method: "POST",
        body: JSON.stringify({
          jobId: "job-123",
          sourceResumeVersionId: "version-1",
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
      {
        params: Promise.resolve({
          id: "profile-1",
        }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "INVALID_TAILORING_SUGGESTIONS",
    });
  });

  it("returns 400 when the source version belongs to another profile", async () => {
    createTailoredResume.mockRejectedValue(new Error("RESUME_VERSION_PROFILE_MISMATCH"));

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/resume-profiles/profile-1/tailored-resumes", {
        method: "POST",
        body: JSON.stringify({
          jobId: "job-123",
          sourceResumeVersionId: "version-99",
        }),
        headers: {
          "content-type": "application/json",
        },
      }),
      {
        params: Promise.resolve({
          id: "profile-1",
        }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "RESUME_VERSION_PROFILE_MISMATCH",
    });
  });
});
