import type { JobEvaluationRecord } from "@coach/core";

import { createEvaluationServer } from "./evaluations";

type ScoreJobFitInput = {
    jobId: string;
    resumeProfileId: string;
};

type ListEvaluationsInput = {
    jobId: string;
    resumeProfileId: string;
};

type CreateAppEvaluationServerDeps = {
    scoreJobFit(input: ScoreJobFitInput): Promise<JobEvaluationRecord>;
    listEvaluationsByJobAndResumeProfile(
        input: ListEvaluationsInput,
    ): Promise<JobEvaluationRecord[]>;
};

export function createAppEvaluationServer(
    deps: CreateAppEvaluationServerDeps,
) {
    return createEvaluationServer(deps);
}