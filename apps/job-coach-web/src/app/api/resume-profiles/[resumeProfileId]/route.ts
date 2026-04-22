import { createDbGetResumeProfile } from "@coach/db";

const getResumeProfile = createDbGetResumeProfile({
    db: {} as never,
});

export async function GET(
    _request: Request,
    context: {
        params: Promise<{
            resumeProfileId: string;
        }>;
    },
) {
    const { resumeProfileId } = await context.params;

    try {
        const result = await getResumeProfile({
            resumeProfileId,
        });

        return Response.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === "RESUME_PROFILE_NOT_FOUND") {
            return Response.json(
                { error: "RESUME_PROFILE_NOT_FOUND" },
                { status: 404 },
            );
        }

        throw error;
    }
}