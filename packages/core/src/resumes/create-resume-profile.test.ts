import { describe, expect, it } from "vitest";

import { createCreateResumeProfile } from "./create-resume-profile";
import { createInMemoryResumeProfileRepository } from "../resumes/in-memory-resume-profile-repository";
import { createInMemoryResumeVersionRepository } from "./in-memory-resume-version-repository";

describe("createCreateResumeProfile", () => {
    it("creates a resume profile and initial version from normalized resume input", async () => {
        const resumeProfiles = createInMemoryResumeProfileRepository();
        const resumeVersions = createInMemoryResumeVersionRepository();

        const createResumeProfile = createCreateResumeProfile({
            resumeProfiles,
            resumeVersions,
        });

        const result = await createResumeProfile({
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
                skills: ["TypeScript", "React", "Node.js"],
                experience: [],
                education: [],
            },
        });

        expect(result).toMatchObject({
            profile: {
                id: expect.any(String),
                name: "Baseline Resume",
                currentVersionId: expect.any(String),
            },
            version: {
                id: expect.any(String),
                profileId: expect.any(String),
                versionNumber: 1,
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
                    skills: ["TypeScript", "React", "Node.js"],
                    experience: [],
                    education: [],
                },
            },
        });

        expect(result.version.profileId).toBe(result.profile.id);
        expect(result.profile.currentVersionId).toBe(result.version.id);

        const savedProfile = await resumeProfiles.getResumeProfileById(result.profile.id);
        const savedVersion = await resumeVersions.getResumeVersionById(result.version.id);

        expect(savedProfile).toEqual(result.profile);
        expect(savedVersion).toEqual(result.version);
    });
});
