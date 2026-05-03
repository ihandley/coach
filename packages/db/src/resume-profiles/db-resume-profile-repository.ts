import type { ResumeProfile } from "@coach/core";

type DbResumeProfileRow = {
  id: string;
  name: string;
  current_version_id?: string | null;
  created_at?: string;
};

function mapResumeProfile(row: DbResumeProfileRow): ResumeProfile {
  return {
    id: row.id,
    name: row.name,
    currentVersionId: row.current_version_id ?? "",
  };
}

export function createDbResumeProfileRepository({ db }: { db: any }) {
  return {
    async listResumeProfiles() {
      const rows = await db
        .selectFrom("resume_profiles")
        .selectAll()
        .orderBy("created_at", "desc")
        .execute();

      return rows.map(mapResumeProfile);
    },

    async createResumeProfile(input: { name: string; currentVersionId: string }) {
      const row = await db
        .insertInto("resume_profiles")
        .values({
          name: input.name,
          current_version_id: input.currentVersionId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return mapResumeProfile(row);
    },

    async getResumeProfileById(resumeProfileId: string) {
      const row = await db
        .selectFrom("resume_profiles")
        .selectAll()
        .where("id", "=", resumeProfileId)
        .executeTakeFirst();

      return row ? mapResumeProfile(row) : null;
    },

    async updateResumeProfileCurrentVersion(input: {
      resumeProfileId: string;
      currentVersionId: string;
    }) {
      const row = await db
        .updateTable("resume_profiles")
        .set({
          current_version_id: input.currentVersionId,
        })
        .where("id", "=", input.resumeProfileId)
        .returningAll()
        .executeTakeFirst();

      if (!row) {
        return null;
      }

      return mapResumeProfile(row);
    },
  };
}
