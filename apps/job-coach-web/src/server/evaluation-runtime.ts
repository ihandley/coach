import type { EvaluationResult } from "@coach/core";
import { createDbJobFitScorer, DbJobEvaluationRepository } from "@coach/db";

import { createAppEvaluationServer } from "./create-evaluation-server";

type Job = {
  id: string;
  company: string;
  title: string;
  sourceUrl: string;
  sourceText: string;
};

type ResumeProfile = {
  id: string;
  name: string;
};

type JobRepository = {
  getJobById(jobId: string): Promise<Job | null>;
};

type ResumeProfileRepository = {
  getResumeProfileById(resumeProfileId: string): Promise<ResumeProfile | null>;
};

type DatabaseClient = {
  jobEvaluation: {
    create(args: {
      data: {
        jobId: string;
        resumeProfileId: string;
        score: number;
        recommendation: string;
        reasoningJson: unknown;
      };
    }): Promise<{
      id: string;
      jobId: string;
      resumeProfileId: string;
      score: number;
      recommendation: string;
      reasoningJson: unknown;
      createdAt: Date | string;
    }>;
    findMany(args: {
      where: {
        jobId: string;
        resumeProfileId: string;
      };
      orderBy?: {
        createdAt: "asc" | "desc";
      };
    }): Promise<
      Array<{
        id: string;
        jobId: string;
        resumeProfileId: string;
        score: number;
        recommendation: string;
        reasoningJson: unknown;
        createdAt: Date | string;
      }>
    >;
  };
};

type CreateEvaluationRuntimeDeps = {
  db: DatabaseClient;
  jobs: JobRepository;
  resumeProfiles: ResumeProfileRepository;
  evaluate?: (input: { job: Job; resumeProfile: ResumeProfile }) => Promise<unknown>;
  fallbackOnInvalidEvaluationResult?: boolean;
};

export function createEvaluationRuntime({
  db,
  jobs,
  resumeProfiles,
  evaluate,
  fallbackOnInvalidEvaluationResult = false,
}: CreateEvaluationRuntimeDeps) {
  const evaluations = new DbJobEvaluationRepository(db);

  const scorer = createDbJobFitScorer({
    jobs,
    resumeProfiles,
    evaluations,
    evaluate,
    fallbackOnInvalidEvaluationResult,
  });

  return createAppEvaluationServer({
    scoreJobFit: scorer.scoreJobFit,
    listEvaluationsByJobAndResumeProfile: evaluations.listByJobAndResumeProfile.bind(evaluations),
  });
}
