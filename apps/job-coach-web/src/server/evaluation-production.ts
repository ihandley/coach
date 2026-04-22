import { DbJobEvaluationRepository, DbResumeProfileRepository, createDbJobFitScorer } from "@coach/db";

import { createEvaluationActions } from "./evaluation-actions";
import { createEvaluationEntry } from "./evaluation-entry";
import { createEvaluationRuntime } from "./evaluation-runtime";

type Job = {
    id: string;
    company: string;
    title: string;
    sourceUrl: string;
    sourceText: string;
};

type ResumeProfile = {
    id: string;
    name: string;
};

type JobRepository = {
    getJobById(jobId: string): Promise<Job | null>;
};

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
    resumeProfile: {
        findUnique(args: {
            where: {
                id: string;
            };
        }): Promise<{
            id: string;
            name: string;
        } | null>;
    };
};

type CreateEvaluationProductionEntryDeps = {
    db: DatabaseClient;
    jobs: JobRepository;
    evaluate?: (input: {
        job: Job;
        resumeProfile: ResumeProfile;
    }) => Promise<unknown>;
    fallbackOnInvalidEvaluationResult?: boolean;
};

export function createEvaluationProductionEntry({
    db,
    jobs,
    evaluate,
    fallbackOnInvalidEvaluationResult = false,
}: CreateEvaluationProductionEntryDeps) {
    const evaluations = new DbJobEvaluationRepository(db);
    const resumeProfiles = new DbResumeProfileRepository(db);

    const scorer = createDbJobFitScorer({
        jobs,
        resumeProfiles,
        evaluations,
        evaluate,
        fallbackOnInvalidEvaluationResult,
    });

    const runtime = createEvaluationRuntime({
        db,
        jobs,
        resumeProfiles,
        evaluate,
        fallbackOnInvalidEvaluationResult,
    });

    const actions = createEvaluationActions({
        runtime,
    });

    return createEvaluationEntry({
        createActions: () => actions,
    });
}