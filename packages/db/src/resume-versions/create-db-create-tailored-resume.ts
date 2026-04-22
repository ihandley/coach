export interface CreateDbCreateTailoredResumeDependencies {
    resumeProfiles: {
        getResumeProfileById(
            resumeProfileId: string,
        ): Promise<{ id: string; name: string; currentVersionId: string } | null>;
        updateResumeProfileCurrentVersion(input: {
            resumeProfileId: string;
            currentVersionId: string;
        }): Promise<unknown>;
    };
    resumeVersions: {
        getResumeVersionById(resumeVersionId: string): Promise<{
            id: string;
            profileId: string;
            versionNumber: number;
            normalizedResume: {
                basics: {
                    fullName: string;
                    headline: string;
                    summary: string;
                };
                skills: string[];
                experience: Array<{
                    company: string;
                    title: string;
                    highlights: string[];
                }>;
                education: unknown[];
            };
        } | null>;
        createResumeVersion(input: {
            profileId: string;
            versionNumber: number;
            kind: "tailored";
            source: {
                kind: string;
                label: string;
            };
            normalizedResume: {
                basics: {
                    fullName: string;
                    headline: string;
                    summary: string;
                };
                skills: string[];
                experience: Array<{
                    company: string;
                    title: string;
                    highlights: string[];
                }>;
                education: unknown[];
            };
            lineage?: {
                sourceResumeVersionId: string;
                sourceJobId: string;
            };
        }): Promise<{
            id: string;
            kind: "tailored";
        }>;
    };
    
    generateTailoringSuggestions?: (input: {
        profileId: string;
        jobId: string;
        sourceResumeVersionId: string;
        tailoredResumeVersionId: string;
    }) => Promise<unknown[]>;
}

export function createDbCreateTailoredResume(
    dependencies: CreateDbCreateTailoredResumeDependencies,
) {
    return async function createTailoredResume(input: {
        profileId: string;
        jobId: string;
        sourceResumeVersionId: string;
    }): Promise<{
        version: {
            id: string;
            kind: "tailored";
            lineage: {
                sourceResumeVersionId: string;
                sourceJobId: string;
            };
        };
        suggestions: unknown[];
    }> {
        const profile = await dependencies.resumeProfiles.getResumeProfileById(
            input.profileId,
        );

        if (!profile) {
            throw new Error(`Resume profile not found: ${input.profileId}`);
        }

        const sourceVersion = await dependencies.resumeVersions.getResumeVersionById(
            input.sourceResumeVersionId,
        );

        if (!sourceVersion) {
            throw new Error(
                `Source resume version not found: ${input.sourceResumeVersionId}`,
            );
        }

        const createdVersion = await dependencies.resumeVersions.createResumeVersion({
            profileId: input.profileId,
            versionNumber: sourceVersion.versionNumber + 1,
            kind: "tailored",
            source: {
                kind: "tailored",
                label: "Tailored resume",
            },
            normalizedResume: sourceVersion.normalizedResume,
            lineage: {
                sourceResumeVersionId: input.sourceResumeVersionId,
                sourceJobId: input.jobId,
            },
        });

        await dependencies.resumeProfiles.updateResumeProfileCurrentVersion({
            resumeProfileId: input.profileId,
            currentVersionId: createdVersion.id,
        });

        const suggestions = dependencies.generateTailoringSuggestions
            ? await dependencies.generateTailoringSuggestions({
                profileId: input.profileId,
                jobId: input.jobId,
                sourceResumeVersionId: input.sourceResumeVersionId,
                tailoredResumeVersionId: createdVersion.id,
            })
            : [];

        return {
            version: {
                id: createdVersion.id,
                kind: "tailored",
                lineage: {
                    sourceResumeVersionId: input.sourceResumeVersionId,
                    sourceJobId: input.jobId,
                },
            },
            suggestions,
        };
    };
}