import { InMemoryJobRepository } from "@coach/core";

import { createEvaluationsServer } from "./index";

const jobs = new InMemoryJobRepository();

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

    resumeProfile: {
        async findUnique(args: { where: { id: string } }) {
            if (args.where.id !== "resume-123") {
                return null;
            }

            return {
                id: "resume-123",
                name: "Baseline Resume",
            };
        },
    },
};

export const evaluationsServer = createEvaluationsServer({
    db,
    jobs,
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