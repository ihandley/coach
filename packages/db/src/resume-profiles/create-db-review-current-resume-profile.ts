import { createReviewCurrentResumeProfile } from "@coach/core";

import { createDbResumeProfileRepository } from "./db-resume-profile-repository";
import { createDbResumeVersionRepository } from "../resume-versions/db-resume-version-repository";

export function createDbReviewCurrentResumeProfile({ db }: { db: any }) {
  const resumeProfiles = createDbResumeProfileRepository({ db });
  const resumeVersions = createDbResumeVersionRepository({ db });

  return createReviewCurrentResumeProfile({
    resumeProfiles,
    resumeVersions,
  });
}
