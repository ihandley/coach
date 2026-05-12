process.env.SUPABASE_URL = "http://127.0.0.1:54321";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createRankedMatchDetails, normalizeRankedScore } from "./route";
import { calculateFit } from "../../../../server/match/calculate-fit";

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

afterEach(() => {
  vi.useRealTimers();
});

describe("normalizeRankedScore", () => {
  it("normalizes persisted percentage scores for ranked jobs", () => {
    expect(normalizeRankedScore(86)).toBe(0.86);
    expect(normalizeRankedScore(17)).toBe(0.17);
    expect(normalizeRankedScore(1)).toBe(0.01);
  });

  it("keeps missing scores distinct from explicit low scores", () => {
    expect(normalizeRankedScore(null)).toBeNull();
    expect(normalizeRankedScore(undefined)).toBeNull();
    expect(normalizeRankedScore(Number.NaN)).toBeNull();
    expect(normalizeRankedScore(0)).toBe(0);
    expect(normalizeRankedScore(1700)).toBe(1);
    expect(normalizeRankedScore(-25)).toBe(0);
  });
});

describe("createRankedMatchDetails", () => {
  it("creates role-specific fallback details for legacy match rows", () => {
    expect(
      createRankedMatchDetails(82, {
        title: "Product Engineer",
        sourceText: "TypeScript React product workflows",
      }),
    ).toEqual({
      strengths: ["Resume shows some relevant evidence for Product Engineer."],
      gaps: [],
      reasons: ["Legacy Product Engineer match: 82% fit using saved score data."],
      recommendation:
        "Strong overlap detected. Prioritize Product Engineer and tailor the resume toward TypeScript, React and Workflows.",
    });
    expect(createRankedMatchDetails(17, { title: "Support Engineer" })).toEqual({
      strengths: [],
      gaps: [
        "The application would be stronger with clearer evidence of the core role requirements.",
      ],
      reasons: ["Legacy Support Engineer match: 17% fit using saved score data."],
      recommendation:
        "Weak overlap detected. Build clearer resume evidence around the core role requirements before prioritizing this role.",
    });
    expect(
      createRankedMatchDetails(36, {
        title: "Analytics Engineer",
        sourceText:
          "predictive analytics job obsessed partner team platform data product engineering",
      }),
    ).toEqual({
      strengths: ["Resume shows some relevant evidence for Analytics Engineer."],
      gaps: [
        "The application would be stronger with clearer evidence of Predictive, platform, data and Product.",
      ],
      reasons: ["Legacy Analytics Engineer match: 36% fit using saved score data."],
      recommendation:
        "Moderate overlap detected. Tailoring the resume toward Predictive, platform, data and Product would strengthen the application.",
    });
  });
});

describe("GET /api/jobs/ranked", () => {
  it("returns nullable scores and sorts new, matched, then unmatched jobs", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-05T12:00:00.000Z"));

    const structuredSummary = {
      location: "Remote",
      salaryRange: "$120,000 to $140,000",
      companyInfo: ["Pattern builds hiring tools."],
      jobDescription: ["Build product workflows."],
      requirements: ["TypeScript"],
      benefits: ["Remote work"],
    };
    const sharedScoringResult = calculateFit(
      {
        title: "Product Engineer",
        company: "Pattern",
        sourceText: "Build TypeScript React product workflows, APIs, and platform reliability.",
      },
      {
        rawText: "Staff product engineer with TypeScript React APIs and platform experience.",
      },
    );

    listJobs.mockResolvedValue([
      {
        id: "job-unmatched",
        title: "Operations Engineer",
        company: "Beacon",
        status: "saved",
        sourceUrl: "https://example.com/unmatched",
        sourceText: "Keep systems running.",
        structuredSummary: null,
        createdAt: "2026-04-20T12:00:00.000Z",
        updatedAt: "2026-04-21T12:00:00.000Z",
      },
      {
        id: "job-high",
        title: "Product Engineer",
        company: "Pattern",
        status: "saved",
        sourceUrl: "https://example.com/job",
        sourceText: "Build thoughtful product workflows.",
        structuredSummary,
        createdAt: "2026-04-25T12:00:00.000Z",
        updatedAt: "2026-04-26T12:00:00.000Z",
      },
      {
        id: "job-new",
        title: "New Platform Engineer",
        company: "Northstar",
        status: "saved",
        sourceUrl: "https://example.com/new",
        sourceText: "Build recent platform workflows.",
        structuredSummary: null,
        createdAt: "2026-05-05T10:00:00.000Z",
        updatedAt: "2026-05-05T10:00:00.000Z",
      },
      {
        id: "job-low",
        title: "Frontend Engineer",
        company: "Signal",
        status: "saved",
        sourceUrl: "https://example.com/low",
        sourceText: "Build interfaces.",
        structuredSummary: null,
        createdAt: "2026-04-24T12:00:00.000Z",
        updatedAt: "2026-04-25T12:00:00.000Z",
      },
      {
        id: "job-zero",
        title: "Support Engineer",
        company: "Harbor",
        status: "saved",
        sourceUrl: "https://example.com/zero",
        sourceText: "Support customers.",
        structuredSummary: null,
        createdAt: "2026-04-23T12:00:00.000Z",
        updatedAt: "2026-04-24T12:00:00.000Z",
      },
    ]);
    selectJobMatches.mockResolvedValue({
      data: [
        {
          job_id: "job-high",
          score: sharedScoringResult.score,
          match_details: sharedScoringResult.matchDetails,
        },
        {
          job_id: "job-low",
          score: 17,
        },
        {
          job_id: "job-zero",
          score: 0,
        },
      ],
    });

    const { GET } = await import("./route");

    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(selectJobMatches).toHaveBeenCalledWith("job_id, score, match_details");
    expect(body).toEqual([
      expect.objectContaining({
        id: "job-new",
        score: null,
        matchDetails: null,
      }),
      expect.objectContaining({
        id: "job-high",
        score: sharedScoringResult.score / 100,
        matchDetails: sharedScoringResult.matchDetails,
        structuredSummary,
      }),
      expect.objectContaining({
        id: "job-low",
        score: 0.17,
        matchDetails: expect.objectContaining({
          strengths: [],
          gaps: ["The application would be stronger with clearer evidence of Interfaces."],
        }),
      }),
      expect.objectContaining({
        id: "job-zero",
        score: 0,
        matchDetails: expect.objectContaining({
          strengths: [],
          gaps: ["The application would be stronger with clearer evidence of Customers."],
        }),
      }),
      expect.objectContaining({
        id: "job-unmatched",
        score: null,
        matchDetails: null,
      }),
    ]);
    expect(JSON.stringify(body)).not.toContain("Good keyword overlap");
    expect(JSON.stringify(body)).not.toContain("Saved fit score suggests relevant overlap");
    expect(JSON.stringify(body)).not.toContain("Fit analysis is based on the saved match score");
    expect(JSON.stringify(body)).not.toContain("posting signals such as");
  });
});
