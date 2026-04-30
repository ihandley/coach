import { createCreateResumeVersion } from "@coach/core";

import { createDbResumeProfileRepository } from "../resume-profiles/db-resume-profile-repository.ts";
import { createDbResumeVersionRepository } from "./db-resume-version-repository.ts";

export function createDbCreateResumeVersion({ db }: { db: any }) {
    const resumeProfiles = createDbResumeProfileRepository({ db });
    const resumeVersions = createDbResumeVersionRepository({ db });

    return createCreateResumeVersion({
        resumeProfiles,
        resumeVersions,
    });
}