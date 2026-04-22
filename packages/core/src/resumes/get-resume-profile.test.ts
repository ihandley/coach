import { describe, expect, it } from "vitest";

import { createCreateResumeProfile } from "./create-resume-profile";
import { createCreateResumeVersion } from "./create-resume-version";
import { createGetResumeProfile } from "./get-resume-profile";
import { createInMemoryResumeProfileRepository } from "./in-memory-resume-profile-repository";
import { createInMemoryResumeVersionRepository } from "./in-memory-resume-version-repository";

describe("createGetResumeProfile", () => {
    it("returns a resume profile and its current version", async () => {
        const resumeProfiles = createInMemoryResumeProfileRepository();
        const resumeVersions = createInMemoryResumeVersionRepository();

        const createResumeProfile = createCreateResumeProfile({
            resumeProfiles,
            resumeVersions,
        });

        const initial = await createResumeProfile({
            name: "Baseline Resume",
            source: {
                kind: "manual",
                label: "baseline-resume",
            },
            normalizedResume: {
                basics: {
                    fullName: "Ian Handley",
                    headline: "Software Engineer",
                    summary: "Builds reliable product systems",
                },
                skills: ["TypeScript", "React"],
                experience: [],
                education: [],
            },
        });

        const createResumeVersion = createCreateResumeVersion({
            resumeProfiles,
            resumeVersions,
        });

        const currentVersion = await createResumeVersion({
            resumeProfileId: initial.profile.id,
            source: {
                kind: "manual",
                label: "baseline-resume-v2",
            },
            normalizedResume: {
                basics: {
                    fullName: "Ian Handley",
                    headline: "Senior Software Engineer",
                    summary: "Builds reliable product systems and leads delivery",
                },
                skills: ["TypeScript", "React", "Node.js"],
                experience: [],
                education: [],
            },
        });

        const getResumeProfile = createGetResumeProfile({
            resumeProfiles,
            resumeVersions,
        });

        const result = await getResumeProfile({
            resumeProfileId: initial.profile.id,
        });

        expect(result).toMatchObject({
            profile: {
                id: initial.profile.id,
                name: "Baseline Resume",
                currentVersionId: currentVersion.id,
            },
            currentVersion: {
                id: currentVersion.id,
                profileId: initial.profile.id,
                versionNumber: 2,
            },
        });
    });
});