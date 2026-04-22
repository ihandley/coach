export interface CreateCoverLetterDraftInput {
    resumeProfileId: string;
    jobId: string;
    candidateName: string;
    companyName: string;
    jobTitle: string;
    jobSummary: string;
    resumeSummary: string;
}

export interface CoverLetterDraft {
    id: string;
    resumeProfileId: string;
    jobId: string;
    content: string;
    createdAt: Date;
}

export async function createCoverLetterDraft(
    input: CreateCoverLetterDraftInput,
): Promise<CoverLetterDraft> {
    const content = [
        `Dear Hiring Team at ${input.companyName},`,
        ``,
        `I am excited to apply for the ${input.jobTitle} role.`,
        ``,
        `${input.resumeSummary}`,
        ``,
        `I am especially interested in this opportunity because ${input.jobSummary}`,
        ``,
        `Sincerely,`,
        input.candidateName,
    ].join("\n");

    return {
        id: crypto.randomUUID(),
        resumeProfileId: input.resumeProfileId,
        jobId: input.jobId,
        content,
        createdAt: new Date(),
    };
}