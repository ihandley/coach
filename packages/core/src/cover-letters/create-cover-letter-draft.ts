import type { CoverLetterDraft, CoverLetterDraftRepository } from "./types";

export interface CreateCoverLetterDraftInput {
  resumeProfileId: string;
  jobId: string;
  candidateName: string;
  companyName: string;
  jobTitle: string;
  jobSummary: string;
  resumeSummary: string;
}

export async function createCoverLetterDraft(
  repository: CoverLetterDraftRepository,
  input: CreateCoverLetterDraftInput,
): Promise<CoverLetterDraft> {
  const content = [
    `Dear Hiring Team at ${input.companyName},`,
    "",
    `I am excited to apply for the ${input.jobTitle} role.`,
    "",
    `${input.resumeSummary}`,
    "",
    `I am especially interested in this opportunity because ${input.jobSummary}`,
    "",
    "Sincerely,",
    input.candidateName,
  ].join("\n");

  return repository.createCoverLetterDraft({
    resumeProfileId: input.resumeProfileId,
    jobId: input.jobId,
    content,
  });
}
