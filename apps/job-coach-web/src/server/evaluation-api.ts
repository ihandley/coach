import type { JobEvaluationRecord } from "@coach/core";

type EvaluationInput = {
  jobId: string;
  resumeProfileId: string;
};

type EvaluationEntrypoints = {
  scoreJobFit(input: EvaluationInput): Promise<JobEvaluationRecord>;
  getLatestEvaluation(input: EvaluationInput): Promise<JobEvaluationRecord | null>;
};

type CreateEvaluationApiDeps = {
  createEntrypoints(): EvaluationEntrypoints;
};

export function createEvaluationApi({ createEntrypoints }: CreateEvaluationApiDeps) {
  const entrypoints = createEntrypoints();

  return {
    async scoreJobFit(input: EvaluationInput) {
      return entrypoints.scoreJobFit(input);
    },

    async getLatestEvaluation(input: EvaluationInput) {
      return entrypoints.getLatestEvaluation(input);
    },
  };
}
