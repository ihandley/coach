import { describe, expect, it, vi } from "vitest";
import { backfillJobMatches } from "./backfill-job-matches";

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

vi.mock("@/server/resume/normalized-resume-to-text", () => ({
  normalizedResumeToText: vi.fn(() => "TypeScript React leadership backend platform"),
}));

describe("backfillJobMatches", () => {
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

    expect(result).toEqual({ updated: 2, resumeProfileId: "profile-1" });
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

  it("falls back to latest resume version when the profile has no normalized resume", async () => {
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
                id: "profile-2",
                normalized_resume: null,
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
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                normalized_resume: { summary: "version resume" },
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

    expect(result).toEqual({ updated: 2, resumeProfileId: "profile-2" });
    expect(upsert).toHaveBeenCalledTimes(1);
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

    expect(result).toEqual({ updated: 2, resumeProfileId: null });
    expect(upsert.mock.calls[0][0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          job_id: "job-1",
          resume_profile_id: null,
        }),
      ]),
    );
  });
});
