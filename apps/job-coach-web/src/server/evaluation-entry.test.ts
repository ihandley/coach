import { describe, expect, it } from "vitest";

import type { JobEvaluationRecord } from "@coach/core";

import { createEvaluationEntry } from "./evaluation-entry";

describe("createEvaluationEntry", () => {
  it("exports callable score and latest-evaluation functions", async () => {
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

    const entry = createEvaluationEntry({
      createActions: () => ({
        scoreJobFitAction: async () => scored,
        getLatestEvaluationAction: async () => scored,
      }),
    });

    await expect(
      entry.scoreJobFit({
        jobId: "job-1",
        resumeProfileId: "resume-1",
      }),
    ).resolves.toMatchObject({
      id: "evaluation-1",
      score: 82,
    });

    await expect(
      entry.getLatestEvaluation({
        jobId: "job-1",
        resumeProfileId: "resume-1",
      }),
    ).resolves.toMatchObject({
      id: "evaluation-1",
      recommendation: "good-fit",
    });
  });
});
