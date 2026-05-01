import { createDbReviewCurrentResumeProfile } from "@coach/db";
import { db } from "../../../../../server/db";

const reviewCurrentResumeProfile = createDbReviewCurrentResumeProfile({
    db,
});

export async function GET(
    _request: Request,
    context: {
        params: Promise<{
            id: string;
        }>;
    },
) {
    const { id: resumeProfileId } = await context.params;

    try {
        const result = await reviewCurrentResumeProfile({
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
