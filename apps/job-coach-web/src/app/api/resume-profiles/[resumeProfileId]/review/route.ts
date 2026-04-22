import { createDbReviewCurrentResumeProfile } from "@coach/db";

const reviewCurrentResumeProfile = createDbReviewCurrentResumeProfile({
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

    const result = await reviewCurrentResumeProfile({
        resumeProfileId,
    });

    return Response.json(result);
}