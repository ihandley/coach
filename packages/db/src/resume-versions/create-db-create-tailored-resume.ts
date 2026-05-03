import type { NormalizedResume } from "@coach/core";

export interface CreateDbCreateTailoredResumeDependencies {
  jobs: {
    getJobById(jobId: string): Promise<{ id: string; company?: string | null } | null>;
  };
  resumeProfiles: {
    getResumeProfileById(
      resumeProfileId: string,
    ): Promise<{ id: string; name: string; currentVersionId: string } | null>;
    createResumeProfile(input: {
      name: string;
      source: {
        kind: string;
        label: string;
      };
      normalizedResume: NormalizedResume;
    }): Promise<{ id: string; name: string; currentVersionId: string }>;
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
      normalizedResume: NormalizedResume;
    } | null>;
    createResumeVersion(input: {
      profileId: string;
      versionNumber: number;
      kind: "tailored";
      source: {
        kind: string;
        label: string;
      };
      normalizedResume: NormalizedResume;
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
    sourceResume: NormalizedResume;
  }) => Promise<unknown[]>;
}

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

function applySafeTailoringToResume({
  sourceResume,
  companyName,
}: {
  sourceResume: NormalizedResume;
  companyName?: string | null;
}): NormalizedResume {
  const tailoredResume = structuredClone(sourceResume);
  const suffix = companyName?.trim() ? ` for ${companyName.trim()}` : "";

  if (tailoredResume.basics) {
    const existingSummary = tailoredResume.basics.summary?.trim() ?? "";

    if (!existingSummary.includes("Targeting roles aligned")) {
      tailoredResume.basics.summary = [
        existingSummary,
        `Targeting roles aligned${suffix}, emphasizing backend systems, scalable platform work, product delivery, and cross-functional engineering leadership.`,
      ]
        .filter(Boolean)
        .join(" ");
    }
  }

  if (Array.isArray(tailoredResume.experience)) {
    tailoredResume.experience = tailoredResume.experience.map((experience, index) => {
      if (!Array.isArray(experience.highlights) || experience.highlights.length === 0) {
        return experience;
      }

      if (index > 1) {
        return experience;
      }

      return {
        ...experience,
        highlights: experience.highlights.map((highlight, highlightIndex) =>
          highlightIndex === 0 && !highlight.includes("Emphasized for relevance")
            ? `${highlight} Emphasized for relevance to the target role${suffix}.`
            : highlight,
        ),
      };
    });
  }

  return tailoredResume;
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
      profileId: string;
      versionNumber: number;
      kind: "tailored";
      source: {
        kind: "tailored";
        label: string;
      };
      lineage: {
        sourceResumeVersionId: string;
        sourceJobId: string;
      };
    };
    tailoredResume: {
      id: string;
      name: string;
      profileId: string;
      versionId: string;
    };
    suggestions: unknown[];
  }> {
    const profile = await dependencies.resumeProfiles.getResumeProfileById(input.profileId);

    if (!profile) {
      throw new Error(`Resume profile not found: ${input.profileId}`);
    }

    const sourceVersion = await dependencies.resumeVersions.getResumeVersionById(
      input.sourceResumeVersionId,
    );

    if (!sourceVersion) {
      throw new Error(`Source resume version not found: ${input.sourceResumeVersionId}`);
    }

    if (sourceVersion.profileId !== input.profileId) {
      throw new Error("RESUME_VERSION_PROFILE_MISMATCH");
    }

    const job = await dependencies.jobs.getJobById(input.jobId);

    if (!job) {
      throw new Error("JOB_NOT_FOUND");
    }

    const tailoredResumeName = createTailoredResumeName({
      sourceResumeName: profile.name,
      companyName: job.company,
    });

    const transformedResume = applySafeTailoringToResume({
      sourceResume: sourceVersion.normalizedResume,
      companyName: job.company,
    });

    const tailoredProfile = await dependencies.resumeProfiles.createResumeProfile({
      name: tailoredResumeName,
      source: {
        kind: "tailored",
        label: tailoredResumeName,
      },
      normalizedResume: transformedResume,
    });

    const createdVersion = await dependencies.resumeVersions.createResumeVersion({
      profileId: tailoredProfile.id,
      versionNumber: 1,
      kind: "tailored",
      source: {
        kind: "tailored",
        label: tailoredResumeName,
      },
      normalizedResume: transformedResume,
      lineage: {
        sourceResumeVersionId: input.sourceResumeVersionId,
        sourceJobId: input.jobId,
      },
    });

    await dependencies.resumeProfiles.updateResumeProfileCurrentVersion({
      resumeProfileId: tailoredProfile.id,
      currentVersionId: createdVersion.id,
    });

    const suggestions = dependencies.generateTailoringSuggestions
      ? await dependencies.generateTailoringSuggestions({
          profileId: input.profileId,
          jobId: input.jobId,
          sourceResumeVersionId: input.sourceResumeVersionId,
          tailoredResumeVersionId: createdVersion.id,
          sourceResume: sourceVersion.normalizedResume,
        })
      : [];

    return {
      version: {
        id: createdVersion.id,
        profileId: tailoredProfile.id,
        versionNumber: 1,
        kind: "tailored",
        source: {
          kind: "tailored",
          label: tailoredResumeName,
        },
        lineage: {
          sourceResumeVersionId: input.sourceResumeVersionId,
          sourceJobId: input.jobId,
        },
      },
      tailoredResume: {
        id: tailoredProfile.id,
        name: tailoredResumeName,
        profileId: tailoredProfile.id,
        versionId: createdVersion.id,
      },
      suggestions,
    };
  };
}
