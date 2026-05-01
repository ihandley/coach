import { describe, it, expect } from "vitest";

import { createImportResumeFromText } from "./import-resume-from-text";
import { createCreateResumeProfile } from "../create-resume-profile";
import { createInMemoryResumeProfileRepository } from "../in-memory-resume-profile-repository";
import { createInMemoryResumeVersionRepository } from "../in-memory-resume-version-repository";

describe("importResumeFromText", () => {
  it("creates profile + version from raw text", async () => {
    const resumeProfiles = createInMemoryResumeProfileRepository();
    const resumeVersions = createInMemoryResumeVersionRepository();

    const createResumeProfile = createCreateResumeProfile({
      resumeProfiles,
      resumeVersions,
    });

    const importResume = createImportResumeFromText({
      createResumeProfile,
    });

    const result = await importResume({
      name: "Imported Resume",
      text: "Software Engineer with experience in TypeScript and React.",
    });

    expect(result.profile.name).toBe("Imported Resume");
    expect(result.profile.currentVersionId).toBeDefined();
    expect(result.version.normalizedResume.rawText).toContain("Software Engineer");
  });
});
