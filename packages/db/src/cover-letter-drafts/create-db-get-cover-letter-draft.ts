import type { CoverLetterDraft } from "@coach/core";

export function createDbGetCoverLetterDraft({ db }: { db: any }) {
  return {
    async getCoverLetterDraftById(id: string): Promise<CoverLetterDraft | null> {
      const row = await db
        .selectFrom("cover_letter_drafts")
        .selectAll()
        .where("id", "=", id)
        .executeTakeFirst();

      if (!row) return null;

      return {
        id: row.id,
        resumeProfileId: row.resume_profile_id,
        jobId: row.job_id,
        content: row.content,
        createdAt: new Date(row.created_at),
      };
    },
  };
}
