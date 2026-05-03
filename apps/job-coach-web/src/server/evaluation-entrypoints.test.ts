import { describe, expect, it } from "vitest";

import type { JobEvaluationRecord } from "@coach/core";

import { createEvaluationEntrypoints } from "./evaluation-entrypoints";

describe("createEvaluationEntrypoints", () => {
  it("exposes scoreJobFit and getLatestEvaluation functions", async () => {
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

    const entrypoints = createEvaluationEntrypoints({
      createEntry: () => ({
        scoreJobFit: async () => scored,
        getLatestEvaluation: async () => scored,
      }),
    });

    await expect(
      entrypoints.scoreJobFit({
        jobId: "job-1",
        resumeProfileId: "resume-1",
      }),
    ).resolves.toMatchObject({
      id: "evaluation-1",
      score: 82,
    });

    await expect(
      entrypoints.getLatestEvaluation({
        jobId: "job-1",
        resumeProfileId: "resume-1",
      }),
    ).resolves.toMatchObject({
      id: "evaluation-1",
      recommendation: "good-fit",
    });
  });
});
