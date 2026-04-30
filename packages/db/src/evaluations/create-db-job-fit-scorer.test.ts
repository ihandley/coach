import { describe, expect, it } from "vitest";

import { InMemoryJobRepository } from "@coach/core";
import { createInMemoryJobEvaluationRepository } from "@coach/core";
import { createInMemoryResumeProfileRepository } from "@coach/core";

import { createDbJobFitScorer } from "./create-db-job-fit-scorer.ts";

describe("createDbJobFitScorer", () => {
    it("creates a scorer backed by the provided repositories", async () => {
        const jobs = new InMemoryJobRepository();
        const resumeProfiles = createInMemoryResumeProfileRepository();
        const evaluations = createInMemoryJobEvaluationRepository();

        const job = await jobs.createJob({
            company: "Acme",
            title: "Software Engineer",
            sourceUrl: "https://example.com/jobs/123",
            sourceText: "Build APIs with TypeScript and Postgres",
            status: "saved",
        });

        const resumeProfile = await resumeProfiles.createResumeProfile({
            name: "Baseline Resume",
            currentVersionId: "resume-version-1",
        });

        const scorer = createDbJobFitScorer({
            jobs,
            resumeProfiles,
            evaluations,
            evaluate: async () => ({
                score: 82,
                recommendation: "good-fit",
                reasoning: {
                    strengths: ["TypeScript experience aligns well"],
                    gaps: ["No explicit Postgres signal"],
                    riskFactors: [],
                    summary: "Solid match with a small database gap.",
                },
            }),
        });

        const evaluation = await scorer.scoreJobFit({
            jobId: job.id,
            resumeProfileId: resumeProfile.id,
        });

        expect(evaluation).toMatchObject({
            jobId: job.id,
            resumeProfileId: resumeProfile.id,
            score: 82,
            recommendation: "good-fit",
        });

        const saved = await evaluations.listByJobAndResumeProfile({
            jobId: job.id,
            resumeProfileId: resumeProfile.id,
        });

        expect(saved).toHaveLength(1);
        expect(saved[0]?.id).toBe(evaluation.id);
    });
});