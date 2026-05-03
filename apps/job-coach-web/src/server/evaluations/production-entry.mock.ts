export function createEvaluationProductionEntry() {
  return {
    scoreJobFit: async () => ({ score: 0 }),

    listByJobAndResumeProfile: async () => [],
  };
}
