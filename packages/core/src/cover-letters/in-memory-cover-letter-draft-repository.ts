import type {
  CoverLetterDraft,
  CoverLetterDraftRepository,
  CreateCoverLetterDraftRecordInput,
} from "./types";

export class InMemoryCoverLetterDraftRepository implements CoverLetterDraftRepository {
  private readonly drafts: CoverLetterDraft[] = [];

  async createCoverLetterDraft(
    input: CreateCoverLetterDraftRecordInput,
  ): Promise<CoverLetterDraft> {
    const draft: CoverLetterDraft = {
      id: crypto.randomUUID(),
      resumeProfileId: input.resumeProfileId,
      jobId: input.jobId,
      content: input.content,
      createdAt: new Date(),
    };

    this.drafts.push(draft);

    return draft;
  }

  getAll(): CoverLetterDraft[] {
    return [...this.drafts];
  }
}
