import { describe, expect, it } from "vitest";

import { createCreateResumeProfile } from "./create-resume-profile";
import { createInMemoryResumeProfileRepository } from "./in-memory-resume-profile-repository";
import { createInMemoryResumeVersionRepository } from "./in-memory-resume-version-repository";
import { createReviewCurrentResumeProfile } from "./review-current-resume-profile";

describe("createReviewCurrentResumeProfile", () => {
    it("reviews the current stored version for a resume profile", async () => {
        const resumeProfiles = createInMemoryResumeProfileRepository();
        const resumeVersions = createInMemoryResumeVersionRepository();

        const createResumeProfile = createCreateResumeProfile({
            resumeProfiles,
            resumeVersions,
        });

        const created = await createResumeProfile({
            name: "Baseline Resume",
            source: {
                kind: "manual",
                label: "baseline-resume",
            },
            normalizedResume: {
                basics: {
                    fullName: "Ian Handley",
                    headline: "Software Engineer",
                    summary: "Builds reliable product systems with TypeScript and React.",
                },
                skills: ["TypeScript", "React", "Node.js"],
                experience: [
                    {
                        company: "Acme",
                        title: "Software Engineer",
                        highlights: ["Built internal tools"],
                    },
                ],
                education: [],
            },
        });

        const reviewCurrentResumeProfile = createReviewCurrentResumeProfile({
            resumeProfiles,
            resumeVersions,
        });

        const review = await reviewCurrentResumeProfile({
            resumeProfileId: created.profile.id,
        });

        expect(review).toMatchObject({
            resumeProfileId: created.profile.id,
            resumeVersionId: created.version.id,
            review: {
                coreStrengths: expect.any(Array),
                missingSignals: expect.any(Array),
                concerns: expect.any(Array),
                targetRoleAlignment: expect.any(Array),
                recommendedImprovements: expect.any(Array),
            },
        });
    });

    it("throws when the resume profile does not exist", async () => {
        const resumeProfiles = createInMemoryResumeProfileRepository();
        const resumeVersions = createInMemoryResumeVersionRepository();

        const reviewCurrentResumeProfile = createReviewCurrentResumeProfile({
            resumeProfiles,
            resumeVersions,
        });

        await expect(
            reviewCurrentResumeProfile({
                resumeProfileId: "missing-profile-id",
            }),
        ).rejects.toThrow("RESUME_PROFILE_NOT_FOUND");
    });

    it("throws when the current resume version does not exist", async () => {
        const resumeProfiles = createInMemoryResumeProfileRepository();
        const resumeVersions = createInMemoryResumeVersionRepository();

        const profile = await resumeProfiles.createResumeProfile({
            name: "Baseline Resume",
            currentVersionId: "missing-version-id",
        });

        const reviewCurrentResumeProfile = createReviewCurrentResumeProfile({
            resumeProfiles,
            resumeVersions,
        });

        await expect(
            reviewCurrentResumeProfile({
                resumeProfileId: profile.id,
            }),
        ).rejects.toThrow("RESUME_VERSION_NOT_FOUND");
    });
});