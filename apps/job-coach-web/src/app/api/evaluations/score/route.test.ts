import { describe, expect, it } from "vitest";
import { handleScoreEvaluation } from "./route-impl";

describe("POST /api/evaluations/score", () => {
  it("returns a scored evaluation", async () => {
    const request = new Request("http://localhost/api/evaluations/score", {
      method: "POST",
      body: JSON.stringify({
        jobId: "job-1",
        resumeProfileId: "resume-1",
      }),
    });

    const response = await handleScoreEvaluation(request, {
      scoreJobFit: async () => ({
        id: "evaluation-1",
        score: 82,
      }),
    });

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toMatchObject({
      id: "evaluation-1",
      score: 82,
    });
  });

  it("returns 400 for invalid input", async () => {
    const request = new Request("http://localhost/api/evaluations/score", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await handleScoreEvaluation(request, {
      scoreJobFit: async () => null,
    });

    expect(response.status).toBe(400);
  });
});
