import type {
    NormalizedResume,
    ResumeProfile,
    ResumeSource,
    ResumeVersion,
} from "./types";

type CreateResumeProfileInput = {
    name: string;
    source: ResumeSource;
    normalizedResume: NormalizedResume;
};

export type CreateResumeProfile = (
    input: CreateResumeProfileInput,
) => Promise<{
    profile: ResumeProfile;
    version: ResumeVersion;
}>;

type ResumeProfileRepository = {
    createResumeProfile(input: {
        name: string;
        currentVersionId: string;
    }): Promise<ResumeProfile>;
    getResumeProfileById(resumeProfileId: string): Promise<ResumeProfile | null>;
};

type ResumeVersionRepository = {
    createResumeVersion(input: {
        id?: string;
        profileId: string;
        versionNumber: number;
        kind: "baseline";
        source: ResumeSource;
        normalizedResume: NormalizedResume;
    }): Promise<ResumeVersion>;
    getResumeVersionById(resumeVersionId: string): Promise<ResumeVersion | null>;
};

export function createCreateResumeProfile({
    resumeProfiles,
    resumeVersions,
}: {
    resumeProfiles: ResumeProfileRepository;
    resumeVersions: ResumeVersionRepository;
}) {
    return async function createResumeProfile(input: CreateResumeProfileInput) {
        const versionId = crypto.randomUUID();

        const profile = await resumeProfiles.createResumeProfile({
            name: input.name,
            currentVersionId: versionId,
        });

        const version = await resumeVersions.createResumeVersion({
            id: versionId,
            profileId: profile.id,
            versionNumber: 1,
            kind: "baseline",
            source: input.source,
            normalizedResume: input.normalizedResume,
        });

        return {
            profile,
            version,
        };
    };
}
