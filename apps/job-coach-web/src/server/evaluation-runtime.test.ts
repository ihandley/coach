import { describe, expect, it } from "vitest";

import {
    InMemoryJobRepository,
    createInMemoryResumeProfileRepository,
} from "@coach/core";

import { createEvaluationRuntime } from "./evaluation-runtime";

describe("createEvaluationRuntime", () => {
    it("builds a runtime that scores and persists evaluations", async () => {
        const jobs = new InMemoryJobRepository();
        const resumeProfiles = createInMemoryResumeProfileRepository();

        const records: Array<{
            id: string;
            jobId: string;
            resumeProfileId: string;
            score: number;
            recommendation: string;
            reasoningJson: unknown;
            createdAt: Date;
        }> = [];

        let nextId = 1;

        const db = {
            jobEvaluation: {
                async create(args: {
                    data: {
                        jobId: string;
                        resumeProfileId: string;
                        score: number;
                        recommendation: string;
                        reasoningJson: unknown;
                    };
                }) {
                    const record = {
                        id: `evaluation-${nextId++}`,
                        jobId: args.data.jobId,
                        resumeProfileId: args.data.resumeProfileId,
                        score: args.data.score,
                        recommendation: args.data.recommendation,
                        reasoningJson: args.data.reasoningJson,
                        createdAt: new Date(),
                    };

                    records.push(record);
                    return record;
                },

                async findMany(args: {
                    where: {
                        jobId: string;
                        resumeProfileId: string;
                    };
                    orderBy?: {
                        createdAt: "asc" | "desc";
                    };
                }) {
                    const filtered = records.filter(
                        (record) =>
                            record.jobId === args.where.jobId &&
                            record.resumeProfileId === args.where.resumeProfileId,
                    );

                    return filtered.sort((a, b) => {
                        if (args.orderBy?.createdAt === "desc") {
                            return b.createdAt.getTime() - a.createdAt.getTime();
                        }

                        return a.createdAt.getTime() - b.createdAt.getTime();
                    });
                },
            },
        };

        const job = await jobs.createJob({
            company: "Acme",
            title: "Software Engineer",
            sourceUrl: "https://example.com/jobs/123",
            sourceText: "Build APIs with TypeScript and Postgres",
            status: "saved",
        });

        const resumeProfile = await resumeProfiles.createResumeProfile({
            name: "Baseline Resume",
        });

        const runtime = createEvaluationRuntime({
            db,
            jobs,
            resumeProfiles,
            evaluate: async () => ({
                score: 82,
                recommendation: "good-fit",
                reasoning: {
                    strengths: ["Strong TypeScript alignment"],
                    gaps: ["No explicit Postgres signal"],
                    riskFactors: [],
                    summary: "Solid match with a small database gap.",
                },
            }),
        });

        const evaluation = await runtime.scoreJobFit({
            jobId: job.id,
            resumeProfileId: resumeProfile.id,
        });

        expect(evaluation).toMatchObject({
            jobId: job.id,
            resumeProfileId: resumeProfile.id,
            score: 82,
            recommendation: "good-fit",
        });

        await expect(
            runtime.getLatestEvaluation({
                jobId: job.id,
                resumeProfileId: resumeProfile.id,
            }),
        ).resolves.toMatchObject({
            id: evaluation.id,
            score: 82,
            recommendation: "good-fit",
        });
    });
});