import { describe, expect, it } from "vitest";

import { createCreateResumeProfile } from "./create-resume-profile.ts";
import { createCreateResumeVersion } from "./create-resume-version.ts";
import { createInMemoryResumeProfileRepository } from "../resumes/in-memory-resume-profile-repository.ts";
import { createInMemoryResumeVersionRepository } from "./in-memory-resume-version-repository.ts";

describe("createCreateResumeVersion", () => {
    it("creates version 2 for an existing resume profile and updates the current version", async () => {
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

        const next = await createResumeVersion({
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

        expect(next).toMatchObject({
            id: expect.any(String),
            profileId: initial.profile.id,
            versionNumber: 2,
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

        const updatedProfile = await resumeProfiles.getResumeProfileById(initial.profile.id);

        expect(updatedProfile).toMatchObject({
            id: initial.profile.id,
            currentVersionId: next.id,
        });
    });

    it("throws when the resume profile does not exist", async () => {
        const resumeProfiles = createInMemoryResumeProfileRepository();
        const resumeVersions = createInMemoryResumeVersionRepository();

        const createResumeVersion = createCreateResumeVersion({
            resumeProfiles,
            resumeVersions,
        });

        await expect(
            createResumeVersion({
                resumeProfileId: "missing-profile-id",
                source: {
                    kind: "manual",
                    label: "missing-profile",
                },
                normalizedResume: {
                    basics: {
                        fullName: "Ian Handley",
                        headline: "Software Engineer",
                        summary: "Builds reliable product systems",
                    },
                    skills: ["TypeScript"],
                    experience: [],
                    education: [],
                },
            }),
        ).rejects.toThrow("RESUME_PROFILE_NOT_FOUND");
    });
});