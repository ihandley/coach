import type { JobEvaluationRecord } from "@coach/core";

type ScoreJobFitInput = {
    jobId: string;
    resumeProfileId: string;
};

type ListEvaluationsInput = {
    jobId: string;
    resumeProfileId: string;
};

export type EvaluationServer = ReturnType<typeof createEvaluationServer>;

type CreateEvaluationServerDeps = {
    scoreJobFit(input: ScoreJobFitInput): Promise<JobEvaluationRecord>;
    listEvaluationsByJobAndResumeProfile(
        input: ListEvaluationsInput,
    ): Promise<JobEvaluationRecord[]>;
};

export function createEvaluationServer({
    scoreJobFit,
    listEvaluationsByJobAndResumeProfile,
}: CreateEvaluationServerDeps) {
    return {
        async scoreJobFit(input: ScoreJobFitInput) {
            return scoreJobFit(input);
        },

        async getLatestEvaluation(
            input: ListEvaluationsInput,
        ): Promise<JobEvaluationRecord | null> {
            const evaluations = await listEvaluationsByJobAndResumeProfile(input);
            return evaluations.at(-1) ?? null;
        },
    };
}