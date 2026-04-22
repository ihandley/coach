import { createDbCreateTailoredResume } from "@coach/db";

const createTailoredResume = createDbCreateTailoredResume({
    resumeProfiles: {} as never,
    resumeVersions: {} as never,
    generateTailoringSuggestions: {} as never,
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
        if (error instanceof Error && error.message === "RESUME_PROFILE_NOT_FOUND") {
            return Response.json({ error: "RESUME_PROFILE_NOT_FOUND" }, { status: 404 });
        }

        if (error instanceof Error && error.message === "RESUME_VERSION_NOT_FOUND") {
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