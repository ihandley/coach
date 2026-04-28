import type { NormalizedResume, ResumeSource, ResumeVersion } from "@coach/core";

type DbResumeVersionRow = {
    id: string;
    profile_id: string;
    version_number: number;
    kind: "baseline" | "tailored";
    source_kind: string;
    source_label: string;
    normalized_resume: NormalizedResume;
    source_resume_version_id: string | null;
    source_job_id: string | null;
};

function mapResumeVersion(row: DbResumeVersionRow): ResumeVersion {
    return {
        id: row.id,
        profileId: row.profile_id,
        versionNumber: row.version_number,
        kind: row.kind,
        source: {
            kind: row.source_kind as ResumeSource["kind"],
            label: row.source_label,
        },
        normalizedResume: row.normalized_resume,
        lineage:
            row.source_resume_version_id || row.source_job_id
                ? {
                      sourceResumeVersionId: row.source_resume_version_id ?? undefined,
                      sourceJobId: row.source_job_id ?? undefined,
                  }
                : undefined,
    };
}

export function createDbResumeVersionRepository({ db }: { db: any }) {
    return {
        async createResumeVersion(input: {
            id?: string;
            profileId: string;
            versionNumber: number;
            kind: "baseline" | "tailored";
            source: ResumeSource;
            normalizedResume: NormalizedResume;
            lineage?: {
                sourceResumeVersionId?: string;
                sourceJobId?: string;
            };
        }) {
            const row = await db
                .insertInto("resume_versions")
                .values({
                    id: input.id,
                    profile_id: input.profileId,
                    version_number: input.versionNumber,
                    kind: input.kind,
                    source_kind: input.source.kind,
                    source_label: input.source.label,
                    normalized_resume: input.normalizedResume,
                    source_resume_version_id: input.lineage?.sourceResumeVersionId ?? null,
                    source_job_id: input.lineage?.sourceJobId ?? null,
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
