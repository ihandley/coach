import { DbJobRepository, createDbJobImporter } from "@coach/db";

export function getDb() {
    const db = {} as any;

    const jobRepo = new DbJobRepository(db);

    return {
        jobRepo: {
            ...jobRepo,
            listJobs: jobRepo.listJobs?.bind(jobRepo) ?? (() => []),
            saveMatchResult: (jobRepo as any).saveMatchResult?.bind(jobRepo) ?? (() => ({})),
            getMatchResults: (jobRepo as any).getMatchResults?.bind(jobRepo) ?? (() => []),
            getJob: (jobRepo as any).getJob?.bind(jobRepo) ?? (() => ({})),
        },
        jobImporter: createDbJobImporter(db),

        resumeRepo: {
            listResumeProfiles: () => [],
        },
    };
}
