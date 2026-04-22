import { describe, expect, it } from "vitest";

import type { JobEvaluationRecord } from "@coach/core";

import { createEvaluationModule } from "./evaluation-module";

describe("createEvaluationModule", () => {
    it("returns app-callable evaluation functions", async () => {
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

        const module = createEvaluationModule({
            createApi: () => ({
                scoreJobFit: async () => scored,
                getLatestEvaluation: async () => scored,
            }),
        });

        await expect(
            module.scoreJobFit({
                jobId: "job-1",
                resumeProfileId: "resume-1",
            }),
        ).resolves.toMatchObject({
            id: "evaluation-1",
            score: 82,
        });

        await expect(
            module.getLatestEvaluation({
                jobId: "job-1",
                resumeProfileId: "resume-1",
            }),
        ).resolves.toMatchObject({
            id: "evaluation-1",
            recommendation: "good-fit",
        });
    });
});