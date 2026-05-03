import { createGenerateTailoringSuggestions } from "@coach/core";

export function createDbGenerateTailoringSuggestions({
  resumeProfiles,
  resumeVersions,
  generateSuggestions,
}: {
  resumeProfiles: {
    getResumeProfileById(resumeProfileId: string): Promise<any>;
  };
  resumeVersions: {
    getResumeVersionById(resumeVersionId: string): Promise<any>;
  };
  generateSuggestions(input: {
    profileId: string;
    jobId: string;
    sourceResumeVersionId: string;
    sourceResume: any;
  }): Promise<unknown>;
}) {
  return createGenerateTailoringSuggestions({
    resumeProfiles,
    resumeVersions,
    generateSuggestions,
  });
}
