import { describe, expect, it } from "vitest";

import { DbJobEvaluationRepository } from "./db-job-evaluation-repository.ts";

describe("DbJobEvaluationRepository", () => {
    it("creates and lists evaluations by job and resume profile", async () => {
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

        const repository = new DbJobEvaluationRepository(db);

        const created = await repository.create({
            jobId: "job-123",
            resumeProfileId: "resume-123",
            score: 82,
            recommendation: "good-fit",
            reasoning: {
                strengths: ["TypeScript experience aligns well"],
                gaps: ["No explicit Postgres signal"],
                riskFactors: [],
                summary: "Solid match with a small database gap.",
            },
        });

        expect(created).toMatchObject({
            jobId: "job-123",
            resumeProfileId: "resume-123",
            score: 82,
            recommendation: "good-fit",
            reasoning: {
                strengths: ["TypeScript experience aligns well"],
                gaps: ["No explicit Postgres signal"],
                riskFactors: [],
                summary: "Solid match with a small database gap.",
            },
        });

        const saved = await repository.listByJobAndResumeProfile({
            jobId: "job-123",
            resumeProfileId: "resume-123",
        });

        expect(saved).toHaveLength(1);
        expect(saved[0]).toMatchObject({
            id: created.id,
            jobId: "job-123",
            resumeProfileId: "resume-123",
            score: 82,
            recommendation: "good-fit",
        });
    });
});