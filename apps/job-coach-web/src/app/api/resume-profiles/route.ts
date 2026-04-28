import { createDbCreateResumeProfile } from "@coach/db";
import { db } from "../../../server/db";

const createResumeProfile = createDbCreateResumeProfile({
    db,
});

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: Request) {
    const body = await request.json();

    if (
        !body ||
        !isNonEmptyString(body.name) ||
        !body.source ||
        !isNonEmptyString(body.source.kind) ||
        !isNonEmptyString(body.source.label) ||
        !body.normalizedResume
    ) {
        return Response.json(
            { error: "INVALID_RESUME_PROFILE_INPUT" },
            { status: 400 },
        );
    }

    const result = await createResumeProfile({
        name: body.name,
        source: body.source,
        normalizedResume: body.normalizedResume,
    });

    return Response.json(result, { status: 201 });
}



export async function GET() {
    const { data, error } = await db
        .from("resume_profiles")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
}
