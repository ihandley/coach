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
    const { calculateFit: actualCalculateFit } = await vi.importActual<
      typeof import("../../../server/match/calculate-fit")
    >("../../../server/match/calculate-fit");
    const job = {
      id: "job-1",
      company: "Pattern",
      title: "Product Engineer",
      sourceText: "Build TypeScript React product workflows, APIs, and platform reliability.",
    };
    const sharedResult = actualCalculateFit(job, {
      rawText: "Staff product engineer with TypeScript React APIs and platform experience.",
    });
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
    getJobById.mockResolvedValue(job);
    normalizedResumeToText.mockReturnValue(
      "Staff product engineer with TypeScript React APIs and platform experience.",
    );
    calculateFit.mockReturnValue(sharedResult);

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
      { rawText: "Staff product engineer with TypeScript React APIs and platform experience." },
    );
    expect(upsert).toHaveBeenCalledWith({
      job_id: "job-1",
      resume_profile_id: "profile-current",
      score: sharedResult.score,
      match_details: sharedResult.matchDetails,
      created_at: expect.any(String),
    });
    await expect(response.json()).resolves.toMatchObject({
      score: sharedResult.score,
      matchDetails: sharedResult.matchDetails,
    });
  });
});
