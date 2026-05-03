import type {
    ResumeProfile,
    ResumeVersion,
    TailoredResume,
    TailoringSuggestion,
} from "./types";

function isPriority(value: unknown): value is "low" | "medium" | "high" {
    return value === "low" || value === "medium" || value === "high";
}

function isConfidence(value: unknown): value is "low" | "medium" | "high" {
    return value === "low" || value === "medium" || value === "high";
}

function isTailoringSuggestion(value: unknown): value is TailoringSuggestion {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Record<string, unknown>;

    return (
        typeof candidate.id === "string" &&
        typeof candidate.sectionTarget === "string" &&
        typeof candidate.originalContent === "string" &&
        typeof candidate.suggestedContent === "string" &&
        typeof candidate.rationale === "string" &&
        Array.isArray(candidate.relatedJobRequirements) &&
        candidate.relatedJobRequirements.every(
            (requirement) => typeof requirement === "string",
        ) &&
        isPriority(candidate.priority) &&
        isConfidence(candidate.confidence)
    );
}

function assertValidTailoringSuggestions(
    suggestions: unknown,
): asserts suggestions is TailoringSuggestion[] {
    if (
        !Array.isArray(suggestions) ||
        !suggestions.every((suggestion) => isTailoringSuggestion(suggestion))
    ) {
        throw new Error("INVALID_TAILORING_SUGGESTIONS");
    }
}

type ResumeProfileRepository = {
    getResumeProfileById(resumeProfileId: string): Promise<ResumeProfile | null>;
    createResumeProfile(input: {
        id?: string;
        name: string;
        currentVersionId: string;
    }): Promise<ResumeProfile>;
    updateResumeProfileCurrentVersion(input: {
        resumeProfileId: string;
        currentVersionId: string;
    }): Promise<ResumeProfile | null>;
};

type ResumeVersionRepository = {
    getResumeVersionById(resumeVersionId: string): Promise<ResumeVersion | null>;
    createResumeVersion(input: {
        id?: string;
        profileId: string;
        versionNumber: number;
        kind: "tailored";
        source: ResumeVersion["source"];
        normalizedResume: ResumeVersion["normalizedResume"];
        lineage?: ResumeVersion["lineage"];
    }): Promise<ResumeVersion>;
    listResumeVersionsByProfileId(profileId: string): Promise<ResumeVersion[]>;
};

type JobRepository = {
    getJobById(
        jobId: string,
    ): Promise<{ id: string; company?: string | null } | null>;
};

function createTailoredResumeName({
    sourceResumeName,
    companyName,
}: {
    sourceResumeName: string;
    companyName?: string | null;
}) {
    const sourceName = sourceResumeName.trim() || "Resume";
    const suffix = companyName?.trim() || "Tailored";

    return `${sourceName} - ${suffix}`;
}

export function createCreateTailoredResume({
    jobs,
    resumeProfiles,
    resumeVersions,
    generateTailoringSuggestions,
}: {
    jobs: JobRepository;
    resumeProfiles: ResumeProfileRepository;
    resumeVersions: ResumeVersionRepository;
    generateTailoringSuggestions(input: {
        profileId: string;
        jobId: string;
        sourceResumeVersionId: string;
    }): Promise<unknown>;
}) {
    return async function createTailoredResume(input: {
        profileId: string;
        jobId: string;
        sourceResumeVersionId: string;
    }): Promise<TailoredResume> {
        const profile = await resumeProfiles.getResumeProfileById(input.profileId);

        if (!profile) {
            throw new Error("RESUME_PROFILE_NOT_FOUND");
        }

        const sourceVersion = await resumeVersions.getResumeVersionById(
            input.sourceResumeVersionId,
        );

        if (!sourceVersion) {
            throw new Error("RESUME_VERSION_NOT_FOUND");
        }

        if (sourceVersion.profileId !== input.profileId) {
            throw new Error("RESUME_VERSION_PROFILE_MISMATCH");
        }

        const job = await jobs.getJobById(input.jobId);

        if (!job) {
            throw new Error("JOB_NOT_FOUND");
        }

        const tailoredResumeName = createTailoredResumeName({
            sourceResumeName: profile.name,
            companyName: job.company,
        });

        const suggestions = await generateTailoringSuggestions({
            profileId: input.profileId,
            jobId: input.jobId,
            sourceResumeVersionId: input.sourceResumeVersionId,
        });

        assertValidTailoringSuggestions(suggestions);

        const tailoredProfile = await resumeProfiles.createResumeProfile({
            name: tailoredResumeName,
            currentVersionId: "",
        });

        const version = await resumeVersions.createResumeVersion({
            profileId: tailoredProfile.id,
            versionNumber: 1,
            kind: "tailored",
            source: {
                kind: "tailored",
                label: tailoredResumeName,
            },
            normalizedResume: sourceVersion.normalizedResume,
            lineage: {
                sourceResumeVersionId: input.sourceResumeVersionId,
                sourceJobId: input.jobId,
            },
        });

        await resumeProfiles.updateResumeProfileCurrentVersion({
            resumeProfileId: tailoredProfile.id,
            currentVersionId: version.id,
        });

        return {
            profile: {
                ...tailoredProfile,
                currentVersionId: version.id,
            },
            version,
            suggestions,
        };
    };
}
