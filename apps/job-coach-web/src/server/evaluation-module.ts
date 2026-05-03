import type { JobEvaluationRecord } from "@coach/core";

type EvaluationInput = {
  jobId: string;
  resumeProfileId: string;
};

type EvaluationApi = {
  scoreJobFit(input: EvaluationInput): Promise<JobEvaluationRecord>;
  getLatestEvaluation(input: EvaluationInput): Promise<JobEvaluationRecord | null>;
};

type CreateEvaluationModuleDeps = {
  createApi(): EvaluationApi;
};

export function createEvaluationModule({ createApi }: CreateEvaluationModuleDeps) {
  const api = createApi();

  return {
    async scoreJobFit(input: EvaluationInput) {
      return api.scoreJobFit(input);
    },

    async getLatestEvaluation(input: EvaluationInput) {
      return api.getLatestEvaluation(input);
    },
  };
}
