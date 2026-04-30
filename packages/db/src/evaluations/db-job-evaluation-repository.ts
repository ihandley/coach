import type { CreateJobEvaluationInput, JobEvaluationRecord } from "@coach/core";

type DatabaseClient = {
    jobEvaluation: {
        create(args: {
            data: {
                jobId: string;
                resumeProfileId: string;
                score: number;
                recommendation: string;
                reasoningJson: unknown;
            };
        }): Promise<{
            id: string;
            jobId: string;
            resumeProfileId: string;
            score: number;
            recommendation: string;
            reasoningJson: unknown;
            createdAt: Date | string;
        }>;
        findMany(args: {
            where: {
                jobId: string;
                resumeProfileId: string;
            };
            orderBy?: {
                createdAt: "asc" | "desc";
            };
        }): Promise<
            Array<{
                id: string;
                jobId: string;
                resumeProfileId: string;
                score: number;
                recommendation: string;
                reasoningJson: unknown;
                createdAt: Date | string;
            }>
        >;
    };
};

function normalizeCreatedAt(value: Date | string): string {
    return typeof value === "string" ? value : value.toISOString();
}

export class DbJobEvaluationRepository {
    private readonly db: DatabaseClient;

    constructor(db: DatabaseClient) {
        this.db = db;
    }

    async create(input: CreateJobEvaluationInput): Promise<JobEvaluationRecord> {
        const created = await this.db.jobEvaluation.create({
            data: {
                jobId: input.jobId,
                resumeProfileId: input.resumeProfileId,
                score: input.score,
                recommendation: input.recommendation,
                reasoningJson: input.reasoning,
            },
        });

        return {
            id: created.id,
            jobId: created.jobId,
            resumeProfileId: created.resumeProfileId,
            score: created.score,
            recommendation: created.recommendation as JobEvaluationRecord["recommendation"],
            reasoning: created.reasoningJson as JobEvaluationRecord["reasoning"],
            createdAt: normalizeCreatedAt(created.createdAt),
        };
    }

    async listByJobAndResumeProfile(input: {
        jobId: string;
        resumeProfileId: string;
    }): Promise<JobEvaluationRecord[]> {
        const records = await this.db.jobEvaluation.findMany({
            where: {
                jobId: input.jobId,
                resumeProfileId: input.resumeProfileId,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        return records.map((record) => ({
            id: record.id,
            jobId: record.jobId,
            resumeProfileId: record.resumeProfileId,
            score: record.score,
            recommendation: record.recommendation as JobEvaluationRecord["recommendation"],
            reasoning: record.reasoningJson as JobEvaluationRecord["reasoning"],
            createdAt: normalizeCreatedAt(record.createdAt),
        }));
    }
}