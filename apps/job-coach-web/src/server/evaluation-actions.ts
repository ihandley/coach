import type { JobEvaluationRecord } from "@coach/core";

type EvaluationActionInput = {
    jobId: string;
    resumeProfileId: string;
};

type EvaluationRuntime = {
    scoreJobFit(input: EvaluationActionInput): Promise<JobEvaluationRecord>;
    getLatestEvaluation(
        input: EvaluationActionInput,
    ): Promise<JobEvaluationRecord | null>;
};

type CreateEvaluationActionsDeps = {
    runtime: EvaluationRuntime;
};

export function createEvaluationActions({
    runtime,
}: CreateEvaluationActionsDeps) {
    return {
        async scoreJobFitAction(input: EvaluationActionInput) {
            return runtime.scoreJobFit(input);
        },

        async getLatestEvaluationAction(input: EvaluationActionInput) {
            return runtime.getLatestEvaluation(input);
        },
    };
}