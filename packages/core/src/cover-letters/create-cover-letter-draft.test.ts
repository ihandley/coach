import { describe, expect, it } from "vitest";

import { createCoverLetterDraft } from "./create-cover-letter-draft.ts";
import type { CoverLetterDraftRepository } from "./types.ts";

function createRepository(): CoverLetterDraftRepository {
    return {
        async createCoverLetterDraft(input) {
            return {
                id: "cover-letter-draft-123",
                resumeProfileId: input.resumeProfileId,
                jobId: input.jobId,
                content: input.content,
                createdAt: new Date("2026-04-22T12:00:00.000Z"),
            };
        },
    };
}

describe("createCoverLetterDraft", () => {
    it("creates a cover letter draft for a resume profile and job", async () => {
        const result = await createCoverLetterDraft(createRepository(), {
            resumeProfileId: "resume-profile-123",
            jobId: "job-123",
            candidateName: "Ian Handley",
            companyName: "Acme",
            jobTitle: "Senior Software Engineer",
            jobSummary:
                "Build product features, collaborate across teams, and improve developer experience.",
            resumeSummary:
                "Software engineer with experience building web applications, APIs, and developer tooling.",
        });

        expect(result).toMatchObject({
            id: "cover-letter-draft-123",
            resumeProfileId: "resume-profile-123",
            jobId: "job-123",
            content: expect.any(String),
        });

        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.content.length).toBeGreaterThan(0);
        expect(result.content).toContain("Acme");
        expect(result.content).toContain("Senior Software Engineer");
    });

    it("formats the draft with greeting, body, and signature", async () => {
        const result = await createCoverLetterDraft(createRepository(), {
            resumeProfileId: "resume-profile-123",
            jobId: "job-123",
            candidateName: "Ian Handley",
            companyName: "Acme",
            jobTitle: "Senior Software Engineer",
            jobSummary:
                "Build product features, collaborate across teams, and improve developer experience.",
            resumeSummary:
                "I have experience building web applications, APIs, and internal tools.",
        });

        expect(result.content).toContain("Dear Hiring Team at Acme,");
        expect(result.content).toContain(
            "I am excited to apply for the Senior Software Engineer role.",
        );
        expect(result.content).toContain(
            "I have experience building web applications, APIs, and internal tools.",
        );
        expect(result.content).toContain(
            "I am especially interested in this opportunity because Build product features, collaborate across teams, and improve developer experience.",
        );
        expect(result.content).toContain("Sincerely,");
        expect(result.content).toContain("Ian Handley");
    });
});