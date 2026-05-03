import { createJobFitScorer } from "@coach/core";

type CreateDbJobFitScorerDeps = Parameters<typeof createJobFitScorer>[0];

export function createDbJobFitScorer(deps: CreateDbJobFitScorerDeps) {
  return createJobFitScorer(deps);
}
