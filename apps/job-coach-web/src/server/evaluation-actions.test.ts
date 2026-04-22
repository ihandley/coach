import { describe, expect, it } from "vitest";

import type { JobEvaluationRecord } from "@coach/core";

import {
    createEvaluationActions,
} from "./evaluation-actions";

describe("createEvaluationActions", () => {
    it("exposes scoreJobFitAction", async () => {
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

        const actions = createEvaluationActions({
            runtime: {
                scoreJobFit: async () => scored,
                getLatestEvaluation: async () => null,
            },
        });

        await expect(
            actions.scoreJobFitAction({
                jobId: "job-1",
                resumeProfileId: "resume-1",
            }),
        ).resolves.toMatchObject({
            id: "evaluation-1",
            score: 82,
        });
    });

    it("exposes getLatestEvaluationAction", async () => {
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

        const actions = createEvaluationActions({
            runtime: {
                scoreJobFit: async () => {
                    throw new Error("not used");
                },
                getLatestEvaluation: async () => scored,
            },
        });

        await expect(
            actions.getLatestEvaluationAction({
                jobId: "job-1",
                resumeProfileId: "resume-1",
            }),
        ).resolves.toMatchObject({
            id: "evaluation-1",
            recommendation: "good-fit",
        });
    });
});