import type { ResumeProfile, ResumeVersion } from "./types";

type ResumeProfileRepository = {
  getResumeProfileById(resumeProfileId: string): Promise<ResumeProfile | null>;
};

type ResumeVersionRepository = {
  getResumeVersionById(resumeVersionId: string): Promise<ResumeVersion | null>;
};

export function createGetResumeProfile({
  resumeProfiles,
  resumeVersions,
}: {
  resumeProfiles: ResumeProfileRepository;
  resumeVersions: ResumeVersionRepository;
}) {
  return async function getResumeProfile(input: { resumeProfileId: string }) {
    const profile = await resumeProfiles.getResumeProfileById(input.resumeProfileId);

    if (!profile) {
      throw new Error("RESUME_PROFILE_NOT_FOUND");
    }

    const currentVersion = await resumeVersions.getResumeVersionById(profile.currentVersionId);

    if (!currentVersion) {
      throw new Error("RESUME_VERSION_NOT_FOUND");
    }

    return {
      profile,
      currentVersion,
    };
  };
}
