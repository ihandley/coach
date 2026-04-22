type ResumeProfile = {
    id: string;
    name: string;
};

type CreateResumeProfileInput = {
    id?: string;
    name: string;
};

export function createInMemoryResumeProfileRepository() {
    const resumeProfiles = new Map<string, ResumeProfile>();

    return {
        async createResumeProfile(input: CreateResumeProfileInput) {
            const profile: ResumeProfile = {
                id: input.id ?? crypto.randomUUID(),
                name: input.name,
            };

            resumeProfiles.set(profile.id, profile);
            return profile;
        },

        async getResumeProfileById(resumeProfileId: string) {
            return resumeProfiles.get(resumeProfileId) ?? null;
        },
    };
}