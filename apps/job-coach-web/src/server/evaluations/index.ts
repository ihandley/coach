import { createEvaluationApi } from "../evaluation-api";
import { createEvaluationApp } from "../evaluation-app";
import { createEvaluationEntrypoints } from "../evaluation-entrypoints";
import { createEvaluationModule } from "../evaluation-module";
import { createEvaluationProductionEntry } from "../evaluation-production";

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
  resumeProfile: {
    findUnique(args: {
      where: {
        id: string;
      };
    }): Promise<{
      id: string;
      name: string;
    } | null>;
  };
};

type CreateEvaluationsServerDeps = {
  db: DatabaseClient;
  jobs: JobRepository;
  evaluate?: (input: { job: Job; resumeProfile: ResumeProfile }) => Promise<unknown>;
  fallbackOnInvalidEvaluationResult?: boolean;
};

export function createEvaluationsServer({
  db,
  jobs,
  evaluate,
  fallbackOnInvalidEvaluationResult = false,
}: CreateEvaluationsServerDeps) {
  const productionEntry = createEvaluationProductionEntry({
    db,
    jobs,
    evaluate,
    fallbackOnInvalidEvaluationResult,
  });

  const entrypoints = createEvaluationEntrypoints({
    createEntry: () => productionEntry,
  });

  const api = createEvaluationApi({
    createEntrypoints: () => entrypoints,
  });

  const module = createEvaluationModule({
    createApi: () => api,
  });

  return createEvaluationApp({
    createModule: () => module,
  });
}
