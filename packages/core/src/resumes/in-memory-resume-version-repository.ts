import type {
    NormalizedResume,
    ResumeSource,
    ResumeVersion,
} from "./types.ts";

export function createInMemoryResumeVersionRepository() {
    const versions: ResumeVersion[] = [];

    return {
        async createResumeVersion(input: {
            id?: string;
            profileId: string;
            versionNumber: number;
            kind: "baseline" | "tailored";
            source: ResumeSource;
            normalizedResume: NormalizedResume;
            lineage?: ResumeVersion["lineage"];
        }): Promise<ResumeVersion> {
            const version: ResumeVersion = {
                id: input.id ?? crypto.randomUUID(),
                profileId: input.profileId,
                versionNumber: input.versionNumber,
                kind: input.kind,
                source: input.source,
                normalizedResume: input.normalizedResume,
                lineage: input.lineage,
            };

            versions.push(version);

            return version;
        },

        async listResumeVersionsByProfileId(
            profileId: string,
        ): Promise<ResumeVersion[]> {
            return versions
                .filter((version) => version.profileId === profileId)
                .sort((a, b) => a.versionNumber - b.versionNumber);
        },

        async getResumeVersionById(
            resumeVersionId: string,
        ): Promise<ResumeVersion | null> {
            return (
                versions.find((version) => version.id === resumeVersionId) ?? null
            );
        },
    };
}