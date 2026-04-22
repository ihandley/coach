import type { NormalizedResume, ResumeSource } from "@coach/core";

type DbResumeVersionRow = {
    id: string;
    profile_id: string;
    version_number: number;
    source_kind: string;
    source_label: string;
    normalized_resume: NormalizedResume;
};

function mapResumeVersion(row: DbResumeVersionRow) {
    return {
        id: row.id,
        profileId: row.profile_id,
        versionNumber: row.version_number,
        source: {
            kind: row.source_kind,
            label: row.source_label,
        },
        normalizedResume: row.normalized_resume,
    };
}

export function createDbResumeVersionRepository({ db }: { db: any }) {
    return {
        async createResumeVersion(input: {
            id?: string;
            profileId: string;
            versionNumber: number;
            source: ResumeSource;
            normalizedResume: NormalizedResume;
        }) {
            const row = await db
                .insertInto("resume_versions")
                .values({
                    id: input.id,
                    profile_id: input.profileId,
                    version_number: input.versionNumber,
                    source_kind: input.source.kind,
                    source_label: input.source.label,
                    normalized_resume: input.normalizedResume,
                })
                .returningAll()
                .executeTakeFirstOrThrow();

            return mapResumeVersion(row);
        },

        async getResumeVersionById(resumeVersionId: string) {
            const row = await db
                .selectFrom("resume_versions")
                .selectAll()
                .where("id", "=", resumeVersionId)
                .executeTakeFirst();

            return row ? mapResumeVersion(row) : null;
        },

        async listResumeVersionsByProfileId(resumeProfileId: string) {
            const rows = await db
                .selectFrom("resume_versions")
                .selectAll()
                .where("profile_id", "=", resumeProfileId)
                .orderBy("version_number", "asc")
                .execute();

            return rows.map(mapResumeVersion);
        },
    };
}