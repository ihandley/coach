import { createDbCreateResumeProfile } from "@coach/db";

const createResumeProfile = createDbCreateResumeProfile({
    db: {} as never,
});

export async function POST(request: Request) {
    const body = await request.json();

    const result = await createResumeProfile({
        name: body.name,
        source: body.source,
        normalizedResume: body.normalizedResume,
    });

    return Response.json(result);
}
