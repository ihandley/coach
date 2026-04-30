import type { JobRepository } from "./job-repository";
import {
    JobImporter,
    type ExtractJob,
    type FetchPage,
    type SavedImportedJob,
} from "./job-importer";

export type RepositoryBackedJobImporterDependencies = {
    repository: JobRepository;
    fetchPage: FetchPage;
    extractJob: ExtractJob;
};

export class RepositoryBackedJobImporter {
    private readonly dependencies: RepositoryBackedJobImporterDependencies;

    constructor(dependencies: RepositoryBackedJobImporterDependencies) {
        this.dependencies = dependencies;
    }

    async importJobFromUrl(url: string) {
        const existing = await this.dependencies.repository.findJobBySourceUrl(url);

        if (existing) {
            return existing;
        }

        let createdJobRecord:
            | Awaited<ReturnType<JobRepository["createJob"]>>
            | undefined;

        const importer = new JobImporter({
            findImportedJobBySourceUrl: async (_sourceUrl: string) => {
                return null;
            },
            fetchPage: this.dependencies.fetchPage,
            extractJob: this.dependencies.extractJob,
            saveImportedJob: async (input): Promise<SavedImportedJob> => {
                const created = await this.dependencies.repository.createJob({
                    company: input.company,
                    title: input.title,
                    sourceUrl: url,
                    sourceText: input.rawDescription,
                    status: "saved",
                });

                createdJobRecord = created;

                return mapJobRecordToSavedImportedJob(created);
            },
        });

        await importer.importJobFromUrl(url);

        if (!createdJobRecord) {
            throw new Error("RepositoryBackedJobImporter failed to persist imported job");
        }

        return createdJobRecord;
    }
}

function mapJobRecordToSavedImportedJob(
    job: Awaited<ReturnType<JobRepository["createJob"]>>,
): SavedImportedJob {
    return {
        id: job.id,
        company: job.company,
        title: job.title,
        rawDescription: job.sourceText,
        sourceUrl: job.sourceUrl,
        sourceText: job.sourceText,
        status: job.status,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
    };
}