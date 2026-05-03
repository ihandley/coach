import { createBaselineResumeReview } from "./create-baseline-resume-review";
import type { ResumeProfile, ResumeVersion } from "./types";

type ResumeProfileRepository = {
  getResumeProfileById(resumeProfileId: string): Promise<ResumeProfile | null>;
};

type ResumeVersionRepository = {
  getResumeVersionById(resumeVersionId: string): Promise<ResumeVersion | null>;
};

export function createReviewCurrentResumeProfile({
  resumeProfiles,
  resumeVersions,
}: {
  resumeProfiles: ResumeProfileRepository;
  resumeVersions: ResumeVersionRepository;
}) {
  return async function reviewCurrentResumeProfile(input: { resumeProfileId: string }) {
    const profile = await resumeProfiles.getResumeProfileById(input.resumeProfileId);

    if (!profile) {
      throw new Error("RESUME_PROFILE_NOT_FOUND");
    }

    const version = await resumeVersions.getResumeVersionById(profile.currentVersionId);

    if (!version) {
      throw new Error("RESUME_VERSION_NOT_FOUND");
    }

    const review = await createBaselineResumeReview(version.normalizedResume);

    return {
      resumeProfileId: profile.id,
      resumeVersionId: version.id,
      review,
    };
  };
}
