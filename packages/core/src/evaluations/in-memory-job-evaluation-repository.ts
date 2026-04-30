import type {
    CreateJobEvaluationInput,
    JobEvaluationRecord,
} from "./types.ts";

function createId(): string {
    return crypto.randomUUID();
}

export function createInMemoryJobEvaluationRepository() {
    const evaluations: JobEvaluationRecord[] = [];

    return {
        async create(input: CreateJobEvaluationInput): Promise<JobEvaluationRecord> {
            const record: JobEvaluationRecord = {
                id: createId(),
                createdAt: new Date().toISOString(),
                ...input,
            };

            evaluations.push(record);
            return record;
        },

        async listByJobAndResumeProfile(input: {
            jobId: string;
            resumeProfileId: string;
        }): Promise<JobEvaluationRecord[]> {
            return evaluations.filter(
                (evaluation) =>
                    evaluation.jobId === input.jobId &&
                    evaluation.resumeProfileId === input.resumeProfileId,
            );
        },
    };
}