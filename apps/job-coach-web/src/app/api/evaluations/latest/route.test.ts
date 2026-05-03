import { beforeEach, describe, expect, it, vi } from "vitest";

const getLatestEvaluation = vi.fn();

vi.mock("../../../../server/evaluations/server", () => ({
  evaluationsServer: {
    getLatestEvaluation,
  },
}));

describe("GET /api/evaluations/latest", () => {
  beforeEach(() => {
    getLatestEvaluation.mockReset();
  });

  it("returns the latest evaluation", async () => {
    getLatestEvaluation.mockResolvedValue({
      id: "evaluation-1",
      jobId: "job-1",
      resumeProfileId: "resume-1",
      score: 82,
      recommendation: "good-fit",
      reasoning: {
        strengths: ["Strong TypeScript alignment"],
        gaps: [],
        riskFactors: [],
        summary: "Solid match",
      },
      createdAt: new Date().toISOString(),
    });

    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/evaluations/latest?jobId=job-1&resumeProfileId=resume-1"),
    );

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toMatchObject({
      id: "evaluation-1",
      score: 82,
    });
  });

  it("returns 400 when query params are missing", async () => {
    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/api/evaluations/latest"));

    expect(response.status).toBe(400);
  });

  it("returns 404 when no evaluation exists", async () => {
    getLatestEvaluation.mockResolvedValue(null);

    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/evaluations/latest?jobId=job-1&resumeProfileId=resume-1"),
    );

    expect(response.status).toBe(404);
  });
});
