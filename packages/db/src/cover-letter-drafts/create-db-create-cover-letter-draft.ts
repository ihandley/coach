import type {
    CoverLetterDraft,
    CoverLetterDraftRepository,
    CreateCoverLetterDraftRecordInput,
} from "@coach/core";

export interface CreateDbCreateCoverLetterDraftDependencies {
    insert: (
        input: CreateCoverLetterDraftRecordInput,
    ) => Promise<CoverLetterDraft>;
}

export function createDbCreateCoverLetterDraft(
    dependencies: CreateDbCreateCoverLetterDraftDependencies,
): CoverLetterDraftRepository {
    return {
        createCoverLetterDraft(input) {
            return dependencies.insert(input);
        },
    };
}