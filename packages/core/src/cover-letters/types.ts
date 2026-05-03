export interface CoverLetterDraft {
  id: string;
  resumeProfileId: string;
  jobId: string;
  content: string;
  createdAt: Date;
}

export interface CreateCoverLetterDraftRecordInput {
  resumeProfileId: string;
  jobId: string;
  content: string;
}

export interface CoverLetterDraftRepository {
  createCoverLetterDraft(input: CreateCoverLetterDraftRecordInput): Promise<CoverLetterDraft>;
}
