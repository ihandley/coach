import { describe, expect, it } from "vitest";

import type { JobEvaluationRecord } from "@coach/core";

import { createAppEvaluationServer } from "./create-evaluation-server";

describe("createAppEvaluationServer", () => {
    it("returns an evaluation server with the expected methods", () => {
        const server = createAppEvaluationServer({
            scoreJobFit: async () => {
                throw new Error("not used");
            },
            listEvaluationsByJobAndResumeProfile: async () => [],
        });

        expect(server).toHaveProperty("scoreJobFit");
        expect(server).toHaveProperty("getLatestEvaluation");
        expect(typeof server.scoreJobFit).toBe("function");
        expect(typeof server.getLatestEvaluation).toBe("function");
    });

    it("delegates to createEvaluationServer", async () => {
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

        const server = createAppEvaluationServer({
            scoreJobFit: async () => scored,
            listEvaluationsByJobAndResumeProfile: async () => [scored],
        });

        await expect(
            server.scoreJobFit({
                jobId: "job-1",
                resumeProfileId: "resume-1",
            }),
        ).resolves.toMatchObject({
            id: "evaluation-1",
            score: 82,
        });

        await expect(
            server.getLatestEvaluation({
                jobId: "job-1",
                resumeProfileId: "resume-1",
            }),
        ).resolves.toMatchObject({
            id: "evaluation-1",
        });
    });
});