import { describe, expect, it } from "vitest";

import { createInMemoryResumeProfileRepository } from "./in-memory-resume-profile-repository.ts";
import { createInMemoryResumeVersionRepository } from "./in-memory-resume-version-repository.ts";
import { createCreateTailoredResume } from "./create-tailored-resume.ts";
import type { NormalizedResume, TailoringSuggestion } from "./types.ts";

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
    it("creates a new tailored resume version with lineage to the source version and job", async () => {
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
            resumeProfiles,
            resumeVersions,
            generateTailoringSuggestions: async () => makeSuggestions(),
        });

        const result = await createTailoredResume({
            profileId: "profile-1",
            jobId: "job-123",
            sourceResumeVersionId: "version-1",
        });

        expect(result.version.profileId).toBe("profile-1");
        expect(result.version.versionNumber).toBe(2);
        expect(result.version.kind).toBe("tailored");
        expect(result.version.lineage).toEqual({
            sourceResumeVersionId: "version-1",
            sourceJobId: "job-123",
        });
        expect(result.suggestions).toHaveLength(1);

        const versions =
            await resumeVersions.listResumeVersionsByProfileId("profile-1");

        expect(versions).toHaveLength(2);
        expect(versions[0]?.id).toBe("version-1");
        expect(versions[1]?.id).toBe(result.version.id);
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

    it("creates a new tailored version on repeated runs instead of mutating history", async () => {
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
        expect(first.version.versionNumber).toBe(2);
        expect(second.version.versionNumber).toBe(3);

        const versions =
            await resumeVersions.listResumeVersionsByProfileId("profile-1");

        expect(versions).toHaveLength(3);
        expect(versions.map((version) => version.versionNumber)).toEqual([1, 2, 3]);
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