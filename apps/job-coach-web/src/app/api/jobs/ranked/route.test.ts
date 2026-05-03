process.env.SUPABASE_URL = "http://127.0.0.1:54321";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { normalizeRankedScore } from "./route";

const listJobs = vi.fn();
const selectJobMatches = vi.fn();

vi.mock("@coach/db", async () => {
  const actual = await vi.importActual<object>("@coach/db");

  class MockDbJobRepository {
    listJobs = listJobs;
  }

  return {
    ...actual,
    createServerClient: vi.fn(() => ({
      from: vi.fn((table: string) => {
        expect(table).toBe("job_matches");

        return {
          select: selectJobMatches,
        };
      }),
    })),
    DbJobRepository: MockDbJobRepository,
  };
});

beforeEach(() => {
  listJobs.mockReset();
  selectJobMatches.mockReset();
  vi.resetModules();
});

describe("normalizeRankedScore", () => {
  it("normalizes persisted percentage scores for ranked jobs", () => {
    expect(normalizeRankedScore(86)).toBe(0.86);
    expect(normalizeRankedScore(17)).toBe(0.17);
    expect(normalizeRankedScore(1)).toBe(0.01);
  });

  it("clamps invalid or out-of-range scores", () => {
    expect(normalizeRankedScore(null)).toBe(0);
    expect(normalizeRankedScore(Number.NaN)).toBe(0);
    expect(normalizeRankedScore(1700)).toBe(1);
    expect(normalizeRankedScore(-25)).toBe(0);
  });
});

describe("GET /api/jobs/ranked", () => {
  it("returns structured summaries with ranked jobs", async () => {
    const structuredSummary = {
      location: "Remote",
      salaryRange: "$120,000 to $140,000",
      companyInfo: ["Pattern builds hiring tools."],
      jobDescription: ["Build product workflows."],
      requirements: ["TypeScript"],
      benefits: ["Remote work"],
    };

    listJobs.mockResolvedValue([
      {
        id: "job-1",
        title: "Product Engineer",
        company: "Pattern",
        status: "saved",
        sourceUrl: "https://example.com/job",
        sourceText: "Build thoughtful product workflows.",
        structuredSummary,
        createdAt: "2026-04-25T12:00:00.000Z",
        updatedAt: "2026-04-26T12:00:00.000Z",
      },
    ]);
    selectJobMatches.mockResolvedValue({
      data: [
        {
          job_id: "job-1",
          score: 82,
        },
      ],
    });

    const { GET } = await import("./route");

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([
      expect.objectContaining({
        id: "job-1",
        title: "Product Engineer",
        company: "Pattern",
        structuredSummary,
        score: 0.82,
      }),
    ]);
  });
});
