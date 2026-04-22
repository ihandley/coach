import type {
    NormalizedResume,
    ResumeProfile,
    ResumeSource,
    ResumeVersion,
} from "./types";

type ResumeProfileRepository = {
    getResumeProfileById(resumeProfileId: string): Promise<ResumeProfile | null>;
    updateResumeProfileCurrentVersion(input: {
        resumeProfileId: string;
        currentVersionId: string;
    }): Promise<ResumeProfile | null>;
};

type ResumeVersionRepository = {
    createResumeVersion(input: {
        id?: string;
        profileId: string;
        versionNumber: number;
        source: ResumeSource;
        normalizedResume: NormalizedResume;
        kind: "baseline";
    }): Promise<ResumeVersion>;
    listResumeVersionsByProfileId(resumeProfileId: string): Promise<ResumeVersion[]>;
};

export function createCreateResumeVersion({
    resumeProfiles,
    resumeVersions,
}: {
    resumeProfiles: ResumeProfileRepository;
    resumeVersions: ResumeVersionRepository;
}) {
    return async function createResumeVersion(input: {
        resumeProfileId: string;
        source: ResumeSource;
        normalizedResume: NormalizedResume;
    }) {
        const profile = await resumeProfiles.getResumeProfileById(input.resumeProfileId);

        if (!profile) {
            throw new Error("RESUME_PROFILE_NOT_FOUND");
        }

        const existingVersions = await resumeVersions.listResumeVersionsByProfileId(
            input.resumeProfileId,
        );

        const nextVersionNumber =
            existingVersions.length === 0
                ? 1
                : Math.max(...existingVersions.map((version) => version.versionNumber)) + 1;

        const version = await resumeVersions.createResumeVersion({
            profileId: input.resumeProfileId,
            versionNumber: nextVersionNumber,
            source: input.source,
            normalizedResume: input.normalizedResume,
            kind: "baseline",
        });

        await resumeProfiles.updateResumeProfileCurrentVersion({
            resumeProfileId: input.resumeProfileId,
            currentVersionId: version.id,
        });

        return version;
    };
}