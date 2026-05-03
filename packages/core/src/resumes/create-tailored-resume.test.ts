import { describe, expect, it } from "vitest";

import { createInMemoryResumeProfileRepository } from "./in-memory-resume-profile-repository";
import { createInMemoryResumeVersionRepository } from "./in-memory-resume-version-repository";
import { createCreateTailoredResume } from "./create-tailored-resume";
import type { NormalizedResume, TailoringSuggestion } from "./types";

function makeResume(): NormalizedResume {
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

function makeSuggestions(): TailoringSuggestion[] {
    return [
        {
            id: "suggestion-1",
            sectionTarget: "summary",
            originalContent: "Backend engineer with API and platform experience.",
            suggestedContent:
                "Backend engineer with API, platform, and fintech integration experience.",
            rationale: "Align summary with the target job domain.",
            relatedJobRequirements: ["payments", "backend systems"],
            priority: "high",
            confidence: "high",
        },
    ];
}

function makeInvalidSuggestions(): unknown {
    return [
        {
            id: "suggestion-1",
            sectionTarget: "summary",
            originalContent: "Backend engineer with API and platform experience.",
            suggestedContent:
                "Backend engineer with API, platform, and fintech integration experience.",
            rationale: "Align summary with the target job domain.",
            relatedJobRequirements: ["payments", "backend systems"],
            priority: "urgent",
            confidence: "high",
        },
    ];
}

describe("createCreateTailoredResume", () => {
    it("creates a separate tailored profile and leaves the source profile unchanged", async () => {
        const resumeProfiles = createInMemoryResumeProfileRepository();
        const resumeVersions = createInMemoryResumeVersionRepository();

        await resumeProfiles.createResumeProfile({
            id: "profile-1",
            name: "Jane Doe Resume",
            currentVersionId: "version-1",
        });

        await resumeVersions.createResumeVersion({
            id: "version-1",
            profileId: "profile-1",
            versionNumber: 1,
            kind: "baseline",
            source: {
                kind: "upload",
                label: "Resume.pdf",
            },
            normalizedResume: makeResume(),
        });

        const createTailoredResume = createCreateTailoredResume({
            jobs: {
                getJobById: async () => ({
                    id: "job-123",
                    company: "Pattern",
                }),
            },
            resumeProfiles,
            resumeVersions,
            generateTailoringSuggestions: async () => makeSuggestions(),
        });

        const result = await createTailoredResume({
            profileId: "profile-1",
            jobId: "job-123",
            sourceResumeVersionId: "version-1",
        });

        expect(result.profile.id).not.toBe("profile-1");
        expect(result.profile.name).toBe("Jane Doe Resume - Pattern");
        expect(result.profile.currentVersionId).toBe(result.version.id);
        expect(result.version.profileId).toBe(result.profile.id);
        expect(result.version.versionNumber).toBe(1);
        expect(result.version.kind).toBe("tailored");
        expect(result.version.source.label).toBe("Jane Doe Resume - Pattern");
        expect(result.version.lineage).toEqual({
            sourceResumeVersionId: "version-1",
            sourceJobId: "job-123",
        });
        expect(result.suggestions).toHaveLength(1);

        const sourceProfile = await resumeProfiles.getResumeProfileById("profile-1");
        const sourceVersions =
            await resumeVersions.listResumeVersionsByProfileId("profile-1");
        const tailoredVersions =
            await resumeVersions.listResumeVersionsByProfileId(result.profile.id);

        expect(sourceProfile).toEqual({
            id: "profile-1",
            name: "Jane Doe Resume",
            currentVersionId: "version-1",
        });
        expect(sourceVersions).toHaveLength(1);
        expect(sourceVersions[0]?.id).toBe("version-1");
        expect(tailoredVersions).toEqual([result.version]);
    });

    it("throws when the source resume version does not exist", async () => {
        const resumeProfiles = createInMemoryResumeProfileRepository();
        const resumeVersions = createInMemoryResumeVersionRepository();

        await resumeProfiles.createResumeProfile({
            id: "profile-1",
            name: "Jane Doe Resume",
            currentVersionId: "version-1",
        });

        const createTailoredResume = createCreateTailoredResume({
            jobs: {
                getJobById: async () => ({
                    id: "job-123",
                    company: "Pattern",
                }),
            },
            resumeProfiles,
            resumeVersions,
            generateTailoringSuggestions: async () => makeSuggestions(),
        });

        await expect(
            createTailoredResume({
                profileId: "profile-1",
                jobId: "job-123",
                sourceResumeVersionId: "missing-version",
            }),
        ).rejects.toThrow("RESUME_VERSION_NOT_FOUND");
    });

    it("throws when the source resume version belongs to a different profile", async () => {
        const resumeProfiles = createInMemoryResumeProfileRepository();
        const resumeVersions = createInMemoryResumeVersionRepository();

        await resumeProfiles.createResumeProfile({
            id: "profile-1",
            name: "Jane Doe Resume",
            currentVersionId: "version-1",
        });

        await resumeProfiles.createResumeProfile({
            id: "profile-2",
            name: "Other Resume",
            currentVersionId: "version-99",
        });

        await resumeVersions.createResumeVersion({
            id: "version-99",
            profileId: "profile-2",
            versionNumber: 1,
            kind: "baseline",
            source: {
                kind: "upload",
                label: "Other.pdf",
            },
            normalizedResume: makeResume(),
        });

        const createTailoredResume = createCreateTailoredResume({
            jobs: {
                getJobById: async () => ({
                    id: "job-123",
                    company: "Pattern",
                }),
            },
            resumeProfiles,
            resumeVersions,
            generateTailoringSuggestions: async () => makeSuggestions(),
        });

        await expect(
            createTailoredResume({
                profileId: "profile-1",
                jobId: "job-123",
                sourceResumeVersionId: "version-99",
            }),
        ).rejects.toThrow("RESUME_VERSION_PROFILE_MISMATCH");
    });

    it("creates a new tailored profile on repeated runs instead of mutating the source", async () => {
        const resumeProfiles = createInMemoryResumeProfileRepository();
        const resumeVersions = createInMemoryResumeVersionRepository();

        await resumeProfiles.createResumeProfile({
            id: "profile-1",
            name: "Jane Doe Resume",
            currentVersionId: "version-1",
        });

        await resumeVersions.createResumeVersion({
            id: "version-1",
            profileId: "profile-1",
            versionNumber: 1,
            kind: "baseline",
            source: {
                kind: "upload",
                label: "Resume.pdf",
            },
            normalizedResume: makeResume(),
        });

        const createTailoredResume = createCreateTailoredResume({
            jobs: {
                getJobById: async () => ({
                    id: "job-123",
                    company: "Pattern",
                }),
            },
            resumeProfiles,
            resumeVersions,
            generateTailoringSuggestions: async () => makeSuggestions(),
        });

        const first = await createTailoredResume({
            profileId: "profile-1",
            jobId: "job-123",
            sourceResumeVersionId: "version-1",
        });

        const second = await createTailoredResume({
            profileId: "profile-1",
            jobId: "job-123",
            sourceResumeVersionId: "version-1",
        });

        expect(first.version.id).not.toBe(second.version.id);
        expect(first.profile.id).not.toBe(second.profile.id);
        expect(first.version.profileId).toBe(first.profile.id);
        expect(second.version.profileId).toBe(second.profile.id);
        expect(first.version.versionNumber).toBe(1);
        expect(second.version.versionNumber).toBe(1);

        const sourceProfile = await resumeProfiles.getResumeProfileById("profile-1");
        const sourceVersions =
            await resumeVersions.listResumeVersionsByProfileId("profile-1");
        const firstTailoredVersions =
            await resumeVersions.listResumeVersionsByProfileId(first.profile.id);
        const secondTailoredVersions =
            await resumeVersions.listResumeVersionsByProfileId(second.profile.id);

        expect(sourceProfile?.currentVersionId).toBe("version-1");
        expect(sourceVersions).toHaveLength(1);
        expect(firstTailoredVersions).toEqual([first.version]);
        expect(secondTailoredVersions).toEqual([second.version]);
    });

    it("throws when generated tailoring suggestions are malformed", async () => {
        const resumeProfiles = createInMemoryResumeProfileRepository();
        const resumeVersions = createInMemoryResumeVersionRepository();

        await resumeProfiles.createResumeProfile({
            id: "profile-1",
            name: "Jane Doe Resume",
            currentVersionId: "version-1",
        });

        await resumeVersions.createResumeVersion({
            id: "version-1",
            profileId: "profile-1",
            versionNumber: 1,
            kind: "baseline",
            source: {
                kind: "upload",
                label: "Resume.pdf",
            },
            normalizedResume: makeResume(),
        });

        const createTailoredResume = createCreateTailoredResume({
            jobs: {
                getJobById: async () => ({
                    id: "job-123",
                    company: "Pattern",
                }),
            },
            resumeProfiles,
            resumeVersions,
            generateTailoringSuggestions: async () => makeInvalidSuggestions() as never,
        });

        await expect(
            createTailoredResume({
                profileId: "profile-1",
                jobId: "job-123",
                sourceResumeVersionId: "version-1",
            }),
        ).rejects.toThrow("INVALID_TAILORING_SUGGESTIONS");

        const versions =
            await resumeVersions.listResumeVersionsByProfileId("profile-1");

        expect(versions).toHaveLength(1);
        expect(versions[0]?.id).toBe("version-1");
    });
});
