import {
    createDbCreateTailoredResume,
    createServerClient,
    DbJobRepository,
} from "@coach/db";
import { generateResumeTailoringSuggestions } from "./generate-tailoring-suggestions";

export function createTailoredResumeService() {
    const db = createServerClient();
    const jobs = new DbJobRepository(db);

    return createDbCreateTailoredResume({
        jobs: {
            async getJobById(jobId: string) {
                const job = await jobs.getJobById(jobId);

                return job
                    ? {
                        id: job.id,
                        company: job.company,
                    }
                    : null;
            },
        },
        resumeProfiles: {
            async getResumeProfileById(resumeProfileId: string) {
                const { data, error } = await db
                    .from("resume_profiles")
                    .select("id,name,current_version_id")
                    .eq("id", resumeProfileId)
                    .maybeSingle();

                if (error) {
                    throw error;
                }

                return data
                    ? {
                        id: data.id,
                        name: data.name,
                        currentVersionId: data.current_version_id ?? "",
                    }
                    : null;
            },
            async createResumeProfile(input: {
                name: string;
                source: {
                    kind: string;
                    label: string;
                };
                normalizedResume: unknown;
            }) {
                const { data, error } = await db
                    .from("resume_profiles")
                    .insert({
                        name: input.name,
                        source: input.source,
                        normalized_resume: input.normalizedResume,
                    })
                    .select("id,name,current_version_id")
                    .single();

                if (error) {
                    throw error;
                }

                return {
                    id: data.id,
                    name: data.name,
                    currentVersionId: data.current_version_id ?? "",
                };
            },
            async updateResumeProfileCurrentVersion(input: {
                resumeProfileId: string;
                currentVersionId: string;
            }) {
                const { data, error } = await db
                    .from("resume_profiles")
                    .update({ current_version_id: input.currentVersionId })
                    .eq("id", input.resumeProfileId)
                    .select("id,name,current_version_id")
                    .maybeSingle();

                if (error) {
                    throw error;
                }

                return data
                    ? {
                        id: data.id,
                        name: data.name,
                        currentVersionId: data.current_version_id ?? "",
                    }
                    : null;
            },
        },
        resumeVersions: {
            async getResumeVersionById(resumeVersionId: string) {
                const { data, error } = await db
                    .from("resume_versions")
                    .select("id,resume_profile_id,version_number,normalized_resume")
                    .eq("id", resumeVersionId)
                    .maybeSingle();

                if (error) {
                    throw error;
                }

                return data
                    ? {
                        id: data.id,
                        profileId: data.resume_profile_id,
                        versionNumber: data.version_number ?? 1,
                        normalizedResume: data.normalized_resume,
                    }
                    : null;
            },
            async createResumeVersion(input: {
                profileId: string;
                versionNumber: number;
                kind: "tailored";
                source: {
                    kind: string;
                    label: string;
                };
                normalizedResume: unknown;
            }) {
                let { data, error } = await db
                    .from("resume_versions")
                    .insert({
                        resume_profile_id: input.profileId,
                        version_number: input.versionNumber,
                        kind: input.kind,
                        source_kind: input.source.kind,
                        source_label: input.source.label,
                        normalized_resume: input.normalizedResume,
                    })
                    .select("id,resume_profile_id,normalized_resume")
                    .single();

                if (error?.code === "PGRST204" || error?.code === "42703") {
                    const fallback = await db
                        .from("resume_versions")
                        .insert({
                            resume_profile_id: input.profileId,
                            normalized_resume: input.normalizedResume,
                        })
                        .select("id,resume_profile_id,normalized_resume")
                        .single();

                    data = fallback.data;
                    error = fallback.error;
                }

                if (error) {
                    throw error;
                }

                if (!data) {
                    throw new Error("RESUME_VERSION_CREATE_FAILED");
                }

                return {
                    id: data.id,
                    kind: input.kind,
                    profileId: data.resume_profile_id,
                    source: {
                        kind: input.source.kind,
                        label: input.source.label,
                    },
                    normalizedResume: data.normalized_resume,
                };
            },
        },
        generateTailoringSuggestions: async ({ jobId, sourceResume }) => {
            const job = await jobs.getJobById(jobId);

            if (!job) {
                throw new Error("JOB_NOT_FOUND");
            }

            return generateResumeTailoringSuggestions({
                job: {
                    title: job.title,
                    company: job.company,
                    sourceText: job.sourceText,
                    structuredSummary: job.structuredSummary,
                },
                sourceResume,
            });
        },
    });
}
