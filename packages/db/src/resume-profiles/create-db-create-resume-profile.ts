import { createCreateResumeProfile } from "@coach/core";

import { createDbResumeProfileRepository } from "./db-resume-profile-repository.ts";
import { createDbResumeVersionRepository } from "../resume-versions/db-resume-version-repository.ts";

export function createDbCreateResumeProfile({ db }: { db: any }) {
    const resumeProfiles = createDbResumeProfileRepository({ db });
    const resumeVersions = createDbResumeVersionRepository({ db });

    return createCreateResumeProfile({
        resumeProfiles,
        resumeVersions,
    });
}
