import type {
    NormalizedResume,
    ResumeSource,
    ResumeVersion,
} from "./types";

type CreateResumeVersionInput = {
    id?: string;
    profileId: string;
    versionNumber: number;
    source: ResumeSource;
    normalizedResume: NormalizedResume;
};

export function createInMemoryResumeVersionRepository() {
    const resumeVersions = new Map<string, ResumeVersion>();

    return {
        async createResumeVersion(input: CreateResumeVersionInput) {
            const version: ResumeVersion = {
                id: input.id ?? crypto.randomUUID(),
                profileId: input.profileId,
                versionNumber: input.versionNumber,
                source: input.source,
                normalizedResume: input.normalizedResume,
            };

            resumeVersions.set(version.id, version);
            return version;
        },

        async getResumeVersionById(resumeVersionId: string) {
            return resumeVersions.get(resumeVersionId) ?? null;
        },

        async listResumeVersionsByProfileId(resumeProfileId: string) {
            return Array.from(resumeVersions.values())
                .filter((version) => version.profileId === resumeProfileId)
                .sort((a, b) => a.versionNumber - b.versionNumber);
        },
    };
}