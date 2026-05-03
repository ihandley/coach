import { describe, expect, it } from "vitest";

import type { JobEvaluationRecord } from "@coach/core";

import { createEvaluationApp } from "./evaluation-app";

describe("createEvaluationApp", () => {
  it("returns concrete app-facing evaluation functions", async () => {
    const scored: JobEvaluationRecord = {
      id: "evaluation-1",
      jobId: "job-1",
      resumeProfileId: "resume-1",
      score: 82,
      recommendation: "good-fit",
      reasoning: {
        strengths: ["Strong TypeScript alignment"],
        gaps: ["No explicit Postgres signal"],
        riskFactors: [],
        summary: "Solid match with a small database gap.",
      },
      createdAt: new Date().toISOString(),
    };

    const app = createEvaluationApp({
      createModule: () => ({
        scoreJobFit: async () => scored,
        getLatestEvaluation: async () => scored,
      }),
    });

    await expect(
      app.scoreJobFit({
        jobId: "job-1",
        resumeProfileId: "resume-1",
      }),
    ).resolves.toMatchObject({
      id: "evaluation-1",
      score: 82,
    });

    await expect(
      app.getLatestEvaluation({
        jobId: "job-1",
        resumeProfileId: "resume-1",
      }),
    ).resolves.toMatchObject({
      id: "evaluation-1",
      recommendation: "good-fit",
    });
  });
});
