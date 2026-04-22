import { describe, expect, it } from "vitest";

import { createDbCreateCoverLetterDraft } from "./create-db-create-cover-letter-draft";

describe("createDbCreateCoverLetterDraft", () => {
    it("creates a cover letter draft through the repository", async () => {
        const insert = async (input: {
            resumeProfileId: string;
            jobId: string;
            content: string;
        }) => ({
            id: "cover-letter-draft-123",
            resumeProfileId: input.resumeProfileId,
            jobId: input.jobId,
            content: input.content,
            createdAt: new Date("2026-04-22T12:00:00.000Z"),
        });

        const createCoverLetterDraft = createDbCreateCoverLetterDraft({ insert });

        const result = await createCoverLetterDraft.createCoverLetterDraft({
            resumeProfileId: "resume-profile-123",
            jobId: "job-123",
            content: "Draft body",
        });

        expect(result).toEqual({
            id: "cover-letter-draft-123",
            resumeProfileId: "resume-profile-123",
            jobId: "job-123",
            content: "Draft body",
            createdAt: new Date("2026-04-22T12:00:00.000Z"),
        });
    });
});