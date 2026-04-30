import { describe, expect, it } from "vitest";

import { InMemoryJobRepository } from "../jobs/in-memory-job-repository";
import { createInMemoryJobEvaluationRepository } from "./in-memory-job-evaluation-repository";
import { createInMemoryResumeProfileRepository } from "../resumes/in-memory-resume-profile-repository";
import { createJobFitScorer } from "./job-fit-scorer";

describe("createJobFitScorer", () => {
    it("throws when the job does not exist", async () => {
        const jobs = new InMemoryJobRepository();
        const resumeProfiles = createInMemoryResumeProfileRepository();

        const scorer = createJobFitScorer({
            jobs,
            resumeProfiles,
        });

        await expect(
            scorer.scoreJobFit({
                jobId: "missing-job-id",
                resumeProfileId: "missing-profile-id",
            }),
        ).rejects.toMatchObject({
            code: "JOB_NOT_FOUND",
        });
    });

    it("throws when the resume profile does not exist", async () => {
        const jobs = new InMemoryJobRepository();
        const resumeProfiles = createInMemoryResumeProfileRepository();

        const job = await jobs.createJob({
            company: "Acme",
            title: "Software Engineer",
            sourceUrl: "https://example.com/jobs/123",
            sourceText: "Example job description",
            status: "saved",
        });

        const scorer = createJobFitScorer({
            jobs,
            resumeProfiles,
        });

        await expect(
            scorer.scoreJobFit({
                jobId: job.id,
                resumeProfileId: "missing-profile-id",
            }),
        ).rejects.toMatchObject({
            code: "RESUME_PROFILE_NOT_FOUND",
        });
    });

    it("creates and returns an evaluation when job and resume profile exist", async () => {
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

        const scorer = createJobFitScorer({
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
            reasoning: {
                strengths: ["TypeScript experience aligns well"],
                gaps: ["No explicit Postgres signal"],
                riskFactors: [],
                summary: "Solid match with a small database gap.",
            },
        });

        const saved = await evaluations.listByJobAndResumeProfile({
            jobId: job.id,
            resumeProfileId: resumeProfile.id,
        });

        expect(saved).toHaveLength(1);
        expect(saved[0]).toMatchObject({
            id: evaluation.id,
            score: 82,
            recommendation: "good-fit",
        });
    });

    it("creates a new evaluation record when re-run for the same job and resume profile", async () => {
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

        let callCount = 0;

        const scorer = createJobFitScorer({
            jobs,
            resumeProfiles,
            evaluations,
            evaluate: async () => {
                callCount += 1;

                if (callCount === 1) {
                    return {
                        score: 82,
                        recommendation: "good-fit",
                        reasoning: {
                            strengths: ["TypeScript experience aligns well"],
                            gaps: ["No explicit Postgres signal"],
                            riskFactors: [],
                            summary: "Solid match with a small database gap.",
                        },
                    };
                }

                return {
                    score: 76,
                    recommendation: "stretch",
                    reasoning: {
                        strengths: ["Backend experience is relevant"],
                        gaps: ["Database depth is still unclear"],
                        riskFactors: ["Role may expect stronger Postgres evidence"],
                        summary: "Possible fit, but risk increased on re-evaluation.",
                    },
                };
            },
        });

        const first = await scorer.scoreJobFit({
            jobId: job.id,
            resumeProfileId: resumeProfile.id,
        });

        const second = await scorer.scoreJobFit({
            jobId: job.id,
            resumeProfileId: resumeProfile.id,
        });

        expect(first.id).not.toBe(second.id);
        expect(first.score).toBe(82);
        expect(second.score).toBe(76);

        const saved = await evaluations.listByJobAndResumeProfile({
            jobId: job.id,
            resumeProfileId: resumeProfile.id,
        });

        expect(saved).toHaveLength(2);
        expect(saved.map((evaluation) => evaluation.id)).toEqual([
            first.id,
            second.id,
        ]);
    });

    it("throws a validation error and does not persist when evaluator output is malformed", async () => {
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

        const scorer = createJobFitScorer({
            jobs,
            resumeProfiles,
            evaluations,
            evaluate: async () =>
                ({
                    score: "82",
                    recommendation: "good-fit",
                    reasoning: {
                        strengths: ["TypeScript experience aligns well"],
                        gaps: ["No explicit Postgres signal"],
                        riskFactors: [],
                        summary: "Solid match with a small database gap.",
                    },
                }) as never,
        });

        await expect(
            scorer.scoreJobFit({
                jobId: job.id,
                resumeProfileId: resumeProfile.id,
            }),
        ).rejects.toMatchObject({
            code: "INVALID_EVALUATION_RESULT",
        });

        const saved = await evaluations.listByJobAndResumeProfile({
            jobId: job.id,
            resumeProfileId: resumeProfile.id,
        });

        expect(saved).toHaveLength(0);
    });

    it("falls back to a deterministic low-confidence evaluation when evaluator output is malformed", async () => {
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

        const scorer = createJobFitScorer({
            jobs,
            resumeProfiles,
            evaluations,
            evaluate: async () =>
                ({
                    score: "82",
                    recommendation: "good-fit",
                    reasoning: {
                        strengths: ["TypeScript experience aligns well"],
                        gaps: ["No explicit Postgres signal"],
                        riskFactors: [],
                        summary: "Solid match with a small database gap.",
                    },
                }) as never,
            fallbackOnInvalidEvaluationResult: true,
        });

        const evaluation = await scorer.scoreJobFit({
            jobId: job.id,
            resumeProfileId: resumeProfile.id,
        });

        expect(evaluation).toMatchObject({
            jobId: job.id,
            resumeProfileId: resumeProfile.id,
            score: 0,
            recommendation: "needs-review",
            reasoning: {
                strengths: [],
                gaps: [],
                riskFactors: ["Evaluator returned malformed output"],
                summary: "Automatic fit evaluation failed validation and requires manual review.",
            },
        });

        const saved = await evaluations.listByJobAndResumeProfile({
            jobId: job.id,
            resumeProfileId: resumeProfile.id,
        });

        expect(saved).toHaveLength(1);
        expect(saved[0]).toMatchObject({
            id: evaluation.id,
            score: 0,
            recommendation: "needs-review",
        });
    });

    it("throws a validation error when evaluator returns an unknown recommendation category", async () => {
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

        const scorer = createJobFitScorer({
            jobs,
            resumeProfiles,
            evaluations,
            evaluate: async () =>
                ({
                    score: 82,
                    recommendation: "maybe",
                    reasoning: {
                        strengths: ["TypeScript experience aligns well"],
                        gaps: ["No explicit Postgres signal"],
                        riskFactors: [],
                        summary: "Solid match with a small database gap.",
                    },
                }) as never,
        });

        await expect(
            scorer.scoreJobFit({
                jobId: job.id,
                resumeProfileId: resumeProfile.id,
            }),
        ).rejects.toMatchObject({
            code: "INVALID_EVALUATION_RESULT",
        });

        const saved = await evaluations.listByJobAndResumeProfile({
            jobId: job.id,
            resumeProfileId: resumeProfile.id,
        });

        expect(saved).toHaveLength(0);
    });
});