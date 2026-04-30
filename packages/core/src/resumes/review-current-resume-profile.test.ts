import { describe, expect, it } from "vitest";

import { createInMemoryResumeProfileRepository } from "./in-memory-resume-profile-repository.ts";
import { createInMemoryResumeVersionRepository } from "./in-memory-resume-version-repository.ts";
import { createReviewCurrentResumeProfile } from "./review-current-resume-profile.ts";

function makeResume() {
    return {
        basics: {
            fullName: "Jane Doe",
            headline: "Software Engineer",
            summary: "Backend engineer with API and platform experience.",
        },
        skills: ["TypeScript", "Node.js", "PostgreSQL"],
        experience: [
            {
                company: "Acme",
                title: "Software Engineer",
                highlights: ["Built internal APIs", "Improved CI pipeline"],
            },
        ],
        education: [],
    };
}

describe("createReviewCurrentResumeProfile", () => {
    it("returns a baseline review for the current resume version", async () => {
        const resumeProfiles = createInMemoryResumeProfileRepository();
        const resumeVersions = createInMemoryResumeVersionRepository();

        const profile = await resumeProfiles.createResumeProfile({
            id: "profile-1",
            name: "Jane Doe Resume",
            currentVersionId: "version-1",
        });

        await resumeVersions.createResumeVersion({
            id: "version-1",
            profileId: profile.id,
            versionNumber: 1,
            kind: "baseline",
            source: {
                kind: "upload",
                label: "Resume.pdf",
            },
            normalizedResume: makeResume(),
        });

        const reviewCurrentResumeProfile = createReviewCurrentResumeProfile({
            resumeProfiles,
            resumeVersions,
        });

        const result = await reviewCurrentResumeProfile({
            resumeProfileId: profile.id,
        });

        expect(result.resumeProfileId).toBe(profile.id);
        expect(result.resumeVersionId).toBe("version-1");
        expect(result.review.coreStrengths.length).toBeGreaterThan(0);
        expect(Array.isArray(result.review.missingSignals)).toBe(true);
        expect(Array.isArray(result.review.concerns)).toBe(true);
        expect(Array.isArray(result.review.recommendedImprovements)).toBe(true);
    });

    it("throws if resume profile does not exist", async () => {
        const resumeProfiles = createInMemoryResumeProfileRepository();
        const resumeVersions = createInMemoryResumeVersionRepository();

        const reviewCurrentResumeProfile = createReviewCurrentResumeProfile({
            resumeProfiles,
            resumeVersions,
        });

        await expect(
            reviewCurrentResumeProfile({
                resumeProfileId: "missing-profile",
            }),
        ).rejects.toThrow("RESUME_PROFILE_NOT_FOUND");
    });

    it("throws if current resume version does not exist", async () => {
        const resumeProfiles = createInMemoryResumeProfileRepository();
        const resumeVersions = createInMemoryResumeVersionRepository();

        await resumeProfiles.createResumeProfile({
            id: "profile-1",
            name: "Jane Doe Resume",
            currentVersionId: "missing-version",
        });

        const reviewCurrentResumeProfile = createReviewCurrentResumeProfile({
            resumeProfiles,
            resumeVersions,
        });

        await expect(
            reviewCurrentResumeProfile({
                resumeProfileId: "profile-1",
            }),
        ).rejects.toThrow("RESUME_VERSION_NOT_FOUND");
    });
});