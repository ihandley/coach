import { beforeEach, describe, expect, it, vi } from "vitest";

const getJobById = vi.fn();
const from = vi.fn();
const calculateFit = vi.fn();
const normalizedResumeToText = vi.fn();

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

vi.mock("@/server/match/normalized-resume-to-text", () => ({
  normalizedResumeToText,
}));

vi.mock("../../../server/match/calculate-fit", () => ({
  calculateFit,
}));

beforeEach(() => {
  getJobById.mockReset();
  from.mockReset();
  calculateFit.mockReset();
  normalizedResumeToText.mockReset();
  vi.resetModules();
});

function createProfileQuery() {
  const query = {
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue({
      data: {
        id: "profile-current",
        normalized_resume: { basics: { name: "Current Resume" } },
      },
      error: null,
    }),
  };

  return query;
}

describe("POST /api/match", () => {
  it("recalculates fit against the default current resume and upserts match details", async () => {
    const profileQuery = createProfileQuery();
    const upsert = vi.fn().mockResolvedValue({ error: null });

    from.mockImplementation((table: string) => {
      if (table === "resume_profiles") {
        return {
          select: vi.fn(() => profileQuery),
        };
      }

      if (table === "job_matches") {
        return { upsert };
      }

      throw new Error(`Unexpected table: ${table}`);
    });
    getJobById.mockResolvedValue({
      id: "job-1",
      company: "Pattern",
      title: "Product Engineer",
      sourceText: "Build product workflows.",
    });
    normalizedResumeToText.mockReturnValue("TypeScript product engineer resume");
    calculateFit.mockReturnValue({
      score: 74,
      reasons: ["Resume evidence overlaps with Product Engineer: TypeScript."],
      matchDetails: {
        strengths: ["Resume evidence overlaps with Product Engineer: TypeScript."],
        gaps: ["Resume evidence is thin for requested areas: Postgres."],
        reasons: ["Resume evidence overlaps with Product Engineer: TypeScript."],
        recommendation:
          "Good fit for Product Engineer. Worth applying with a tailored resume that reinforces TypeScript.",
      },
    });

    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/match", {
        method: "POST",
        body: JSON.stringify({ jobId: "job-1", resumeProfileId: "default" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(getJobById).toHaveBeenCalledWith("job-1");
    expect(profileQuery.eq).not.toHaveBeenCalled();
    expect(calculateFit).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "job-1",
        company: "Pattern",
        title: "Product Engineer",
      }),
      { rawText: "TypeScript product engineer resume" },
    );
    expect(upsert).toHaveBeenCalledWith({
      job_id: "job-1",
      resume_profile_id: "profile-current",
      score: 74,
      match_details: {
        strengths: ["Resume evidence overlaps with Product Engineer: TypeScript."],
        gaps: ["Resume evidence is thin for requested areas: Postgres."],
        reasons: ["Resume evidence overlaps with Product Engineer: TypeScript."],
        recommendation:
          "Good fit for Product Engineer. Worth applying with a tailored resume that reinforces TypeScript.",
      },
      created_at: expect.any(String),
    });
    await expect(response.json()).resolves.toMatchObject({
      score: 74,
      matchDetails: {
        strengths: ["Resume evidence overlaps with Product Engineer: TypeScript."],
      },
    });
  });
});
