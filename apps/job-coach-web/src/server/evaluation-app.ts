import type { JobEvaluationRecord } from "@coach/core";

type EvaluationInput = {
    jobId: string;
    resumeProfileId: string;
};

type EvaluationModule = {
    scoreJobFit(input: EvaluationInput): Promise<JobEvaluationRecord>;
    getLatestEvaluation(
        input: EvaluationInput,
    ): Promise<JobEvaluationRecord | null>;
};

type CreateEvaluationAppDeps = {
    createModule(): EvaluationModule;
};

export function createEvaluationApp({
    createModule,
}: CreateEvaluationAppDeps) {
    const module = createModule();

    return {
        async scoreJobFit(input: EvaluationInput) {
            return module.scoreJobFit(input);
        },

        async getLatestEvaluation(input: EvaluationInput) {
            return module.getLatestEvaluation(input);
        },
    };
}