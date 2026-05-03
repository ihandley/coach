export const RECOMMENDATION_CATEGORIES = [
  "strong-fit",
  "good-fit",
  "stretch",
  "low-fit",
  "skip",
  "needs-review",
] as const;

export type RecommendationCategory = (typeof RECOMMENDATION_CATEGORIES)[number];

export type EvaluationReasoning = {
  strengths: string[];
  gaps: string[];
  riskFactors: string[];
  summary: string;
};

export type EvaluationResult = {
  score: number;
  recommendation: RecommendationCategory;
  reasoning: EvaluationReasoning;
};

export type JobEvaluationRecord = {
  id: string;
  jobId: string;
  resumeProfileId: string;
  score: number;
  recommendation: RecommendationCategory;
  reasoning: EvaluationReasoning;
  createdAt: string;
};

export type CreateJobEvaluationInput = Omit<JobEvaluationRecord, "id" | "createdAt">;
