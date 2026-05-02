import { extractJobStub, fetchJobPageAsDependency } from "@coach/ai";
import { createServerClient } from "@coach/db";
import { createDbResumeProfileRepository } from "@coach/db";
import { DbJobRepository, createDbJobImporter } from "@coach/db";

export function getDb() {
  const db = createServerClient();

  const jobRepo = new DbJobRepository(db);
  const resumeProfiles = createDbResumeProfileRepository({ db });

  return {
    jobRepo: {
      ...jobRepo,
      listJobs: jobRepo.listJobs?.bind(jobRepo) ?? (() => []),
      saveMatchResult: (jobRepo as any).saveMatchResult?.bind(jobRepo) ?? (() => ({})),
      getMatchResults: (jobRepo as any).getMatchResults?.bind(jobRepo) ?? (() => []),
      getJob: (jobRepo as any).getJob?.bind(jobRepo) ?? (() => ({})),
    },

    jobImporter: createDbJobImporter({
      fetchPage: fetchJobPageAsDependency,
      extractJob: extractJobStub,
    }),

    resumeRepo: {
      listResumeProfiles: resumeProfiles.listResumeProfiles.bind(resumeProfiles),
    },
  };
}
