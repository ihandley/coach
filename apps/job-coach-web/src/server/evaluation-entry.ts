import type { JobEvaluationRecord } from "@coach/core";

type EvaluationInput = {
  jobId: string;
  resumeProfileId: string;
};

type EvaluationActions = {
  scoreJobFitAction(input: EvaluationInput): Promise<JobEvaluationRecord>;
  getLatestEvaluationAction(input: EvaluationInput): Promise<JobEvaluationRecord | null>;
};

type CreateEvaluationEntryDeps = {
  createActions(): EvaluationActions;
};

export function createEvaluationEntry({ createActions }: CreateEvaluationEntryDeps) {
  const actions = createActions();

  return {
    async scoreJobFit(input: EvaluationInput) {
      return actions.scoreJobFitAction(input);
    },

    async getLatestEvaluation(input: EvaluationInput) {
      return actions.getLatestEvaluationAction(input);
    },
  };
}
