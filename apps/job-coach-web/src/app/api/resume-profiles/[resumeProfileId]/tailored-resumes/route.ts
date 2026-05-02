import { createDbCreateTailoredResume } from "@coach/db";
import { db } from "../../../../../server/db";

const createTailoredResume = createDbCreateTailoredResume({
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
                .select("id,resume_profile_id,normalized_resume")
                .eq("id", resumeVersionId)
                .maybeSingle();

            if (error) {
                throw error;
            }

            return data
                ? {
                    id: data.id,
                    profileId: data.resume_profile_id,
                    versionNumber: 1,
                    normalizedResume: data.normalized_resume,
                }
                : null;
        },
        async createResumeVersion(input: {
            profileId: string;
            kind: "tailored";
            normalizedResume: unknown;
        }) {
            const { data, error } = await db
                .from("resume_versions")
                .insert({
                    resume_profile_id: input.profileId,
                    normalized_resume: input.normalizedResume,
                })
                .select("id,resume_profile_id,normalized_resume")
                .single();

            if (error) {
                throw error;
            }

            return {
                id: data.id,
                kind: input.kind,
                profileId: data.resume_profile_id,
                normalizedResume: data.normalized_resume,
            };
        },
    },
});

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

export async function POST(
    request: Request,
    context: {
        params: Promise<{
            resumeProfileId: string;
        }>;
    },
) {
    const { resumeProfileId } = await context.params;
    const body = await request.json();

    if (
        !body ||
        !isNonEmptyString(body.jobId) ||
        !isNonEmptyString(body.sourceResumeVersionId)
    ) {
        return Response.json(
            { error: "INVALID_TAILORED_RESUME_INPUT" },
            { status: 400 },
        );
    }

    try {
        const result = await createTailoredResume({
            profileId: resumeProfileId,
            jobId: body.jobId,
            sourceResumeVersionId: body.sourceResumeVersionId,
        });

        return Response.json(result);
    } catch (error) {
        if (
            error instanceof Error &&
            (error.message === "RESUME_PROFILE_NOT_FOUND" ||
                error.message.startsWith("Resume profile not found:"))
        ) {
            return Response.json({ error: "RESUME_PROFILE_NOT_FOUND" }, { status: 404 });
        }

        if (
            error instanceof Error &&
            (error.message === "RESUME_VERSION_NOT_FOUND" ||
                error.message.startsWith("Source resume version not found:"))
        ) {
            return Response.json({ error: "RESUME_VERSION_NOT_FOUND" }, { status: 404 });
        }

        if (
            error instanceof Error &&
            error.message === "INVALID_TAILORING_SUGGESTIONS"
        ) {
            return Response.json(
                { error: "INVALID_TAILORING_SUGGESTIONS" },
                { status: 400 },
            );
        }

        throw error;
    }
}
