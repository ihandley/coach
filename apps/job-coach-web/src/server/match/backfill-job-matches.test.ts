import { beforeEach, describe, expect, it, vi } from "vitest";
import { backfillJobMatches } from "./backfill-job-matches";
import { normalizedResumeToText } from "./normalized-resume-to-text";

const { normalizedResumeToTextMock } = vi.hoisted(() => ({
  normalizedResumeToTextMock: vi.fn(),
}));

const jobs = [
  {
    id: "job-1",
    title: "Staff Software Engineer",
    company: "Acme",
    description: "TypeScript React leadership platform engineering",
  },
  {
    id: "job-2",
    title: "Junior Designer",
    company: "Beta",
    description: "Figma brand illustration",
  },
];

vi.mock("@coach/db", () => {
  return {
    DbJobRepository: class {
      listJobs() {
        return Promise.resolve(jobs);
      }
    },
  };
});

vi.mock("./normalized-resume-to-text", () => ({
  normalizedResumeToText: normalizedResumeToTextMock,
}));

describe("backfillJobMatches", () => {
  beforeEach(() => {
    normalizedResumeToTextMock.mockReset();
    normalizedResumeToTextMock.mockReturnValue("TypeScript React leadership backend platform");
  });

  it("calculates and upserts a match row for every job", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });

    const db = {
      from: vi.fn((table: string) => {
        if (table === "resume_profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "profile-1",
                normalized_resume: { summary: "resume" },
                current_version_id: null,
                created_at: "2026-01-01T00:00:00.000Z",
              },
              error: null,
            }),
          };
        }

        if (table === "job_matches") {
          return { upsert };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    } as any;

    const result = await backfillJobMatches(db);

    expect(result).toEqual({ updated: 2, resumeProfileId: "profile-1", resumeVersionId: null });
    expect(upsert).toHaveBeenCalledTimes(1);

    const rows = upsert.mock.calls[0][0];

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      job_id: "job-1",
      resume_profile_id: "profile-1",
      match_details: {
        strengths: expect.any(Array),
        gaps: expect.any(Array),
        reasons: expect.any(Array),
        recommendation: expect.any(String),
      },
    });
    expect(typeof rows[0].score).toBe("number");
    expect(typeof rows[1].score).toBe("number");
  });

  it("uses the profile current resume version before the baseline profile resume", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    normalizedResumeToTextMock.mockImplementation((resume) => {
      if ((resume as { summary?: string }).summary === "tailored resume") {
        return "TypeScript React leadership backend platform";
      }

      return "Figma brand illustration";
    });

    const db = {
      from: vi.fn((table: string) => {
        if (table === "resume_profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "profile-2",
                normalized_resume: { summary: "baseline profile resume" },
                current_version_id: "version-current",
                created_at: "2026-01-01T00:00:00.000Z",
              },
              error: null,
            }),
          };
        }

        if (table === "resume_versions") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "version-current",
                resume_profile_id: "profile-2",
                normalized_resume: { summary: "tailored resume" },
                created_at: "2026-01-02T00:00:00.000Z",
              },
              error: null,
            }),
          };
        }

        if (table === "job_matches") {
          return { upsert };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    } as any;

    const result = await backfillJobMatches(db);

    expect(result).toEqual({
      updated: 2,
      resumeProfileId: "profile-2",
      resumeVersionId: "version-current",
    });
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(normalizedResumeToText).toHaveBeenCalledWith({ summary: "tailored resume" });
    expect(normalizedResumeToText).not.toHaveBeenCalledWith({
      summary: "baseline profile resume",
    });
  });

  it("uses an explicit resume version when provided", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });

    const db = {
      from: vi.fn((table: string) => {
        if (table === "resume_versions") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "version-tailored",
                resume_profile_id: "profile-tailored",
                normalized_resume: { summary: "explicit tailored resume" },
                created_at: "2026-01-02T00:00:00.000Z",
              },
              error: null,
            }),
          };
        }

        if (table === "job_matches") {
          return { upsert };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    } as any;

    const result = await backfillJobMatches(db, {
      resumeProfileId: "profile-tailored",
      resumeVersionId: "version-tailored",
    });

    expect(result).toEqual({
      updated: 2,
      resumeProfileId: "profile-tailored",
      resumeVersionId: "version-tailored",
    });
    expect(normalizedResumeToText).toHaveBeenCalledWith({ summary: "explicit tailored resume" });
  });

  it("calculates matches with empty resume text when no resume profile exists", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });

    const db = {
      from: vi.fn((table: string) => {
        if (table === "resume_profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }

        if (table === "job_matches") {
          return { upsert };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    } as any;

    const result = await backfillJobMatches(db);

    expect(result).toEqual({ updated: 2, resumeProfileId: null, resumeVersionId: null });
    expect(upsert.mock.calls[0][0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: "job-1",
          resume_profile_id: null,
        }),
      ]),
    );
  });

  it("calculates matches with empty resume text when an explicit resume version is missing", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });

    const db = {
      from: vi.fn((table: string) => {
        if (table === "resume_versions") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }

        if (table === "job_matches") {
          return { upsert };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    } as any;

    const result = await backfillJobMatches(db, {
      resumeProfileId: "profile-missing-version",
      resumeVersionId: "missing-version",
    });

    expect(result).toEqual({
      updated: 2,
      resumeProfileId: "profile-missing-version",
      resumeVersionId: null,
    });
    expect(upsert).toHaveBeenCalledTimes(1);
  });
});
