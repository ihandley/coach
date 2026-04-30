import type {
    ResumeProfile,
} from "./types.ts";

type CreateResumeProfileInput = {
    id?: string;
    name: string;
    currentVersionId: string;
};

export function createInMemoryResumeProfileRepository() {
    const resumeProfiles = new Map<string, ResumeProfile>();

    return {
        async createResumeProfile(input: CreateResumeProfileInput) {
            const profile: ResumeProfile = {
                id: input.id ?? crypto.randomUUID(),
                name: input.name,
                currentVersionId: input.currentVersionId,
            };

            resumeProfiles.set(profile.id, profile);
            return profile;
        },

        async getResumeProfileById(resumeProfileId: string) {
            return resumeProfiles.get(resumeProfileId) ?? null;
        },

        async updateResumeProfileCurrentVersion(input: {
            resumeProfileId: string;
            currentVersionId: string;
        }) {
            const existing = resumeProfiles.get(input.resumeProfileId);

            if (!existing) {
                return null;
            }

            const updated: ResumeProfile = {
                ...existing,
                currentVersionId: input.currentVersionId,
            };

            resumeProfiles.set(updated.id, updated);
            return updated;
        },
    };
}