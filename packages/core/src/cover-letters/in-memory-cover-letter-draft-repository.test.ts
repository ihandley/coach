import { describe, expect, it } from "vitest";

import { InMemoryCoverLetterDraftRepository } from "./in-memory-cover-letter-draft-repository.ts";

describe("InMemoryCoverLetterDraftRepository", () => {
    it("stores and returns created cover letter drafts", async () => {
        const repository = new InMemoryCoverLetterDraftRepository();

        const result = await repository.createCoverLetterDraft({
            resumeProfileId: "resume-profile-123",
            jobId: "job-123",
            content: "Cover letter content",
        });

        expect(result).toMatchObject({
            resumeProfileId: "resume-profile-123",
            jobId: "job-123",
            content: "Cover letter content",
        });

        expect(result.id).toEqual(expect.any(String));
        expect(result.createdAt).toBeInstanceOf(Date);

        expect(repository.getAll()).toHaveLength(1);
        expect(repository.getAll()[0]).toEqual(result);
    });
});