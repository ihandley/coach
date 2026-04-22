import type { JobEvaluationRecord } from "@coach/core";

type EvaluationInput = {
    jobId: string;
    resumeProfileId: string;
};

type EvaluationEntry = {
    scoreJobFit(input: EvaluationInput): Promise<JobEvaluationRecord>;
    getLatestEvaluation(
        input: EvaluationInput,
    ): Promise<JobEvaluationRecord | null>;
};

type CreateEvaluationEntrypointsDeps = {
    createEntry(): EvaluationEntry;
};

export function createEvaluationEntrypoints({
    createEntry,
}: CreateEvaluationEntrypointsDeps) {
    return {
        async scoreJobFit(input: EvaluationInput) {
            return createEntry().scoreJobFit(input);
        },

        async getLatestEvaluation(input: EvaluationInput) {
            return createEntry().getLatestEvaluation(input);
        },
    };
}