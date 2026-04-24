import { createServerClient } from "@coach/db";

const supabase = createServerClient();

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

export async function GET() {
    const { data, error } = await supabase
        .from("resume_profiles")
        .select("id, name")
        .order("created_at", { ascending: false });

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
}

export async function POST(request: Request) {
    const body = await request.json();

    if (!body || !isNonEmptyString(body.name)) {
        return Response.json(
            { error: "INVALID_RESUME_PROFILE_INPUT" },
            { status: 400 },
        );
    }

    const { data, error } = await supabase
        .from("resume_profiles")
        .insert({
            name: body.name,
            source: {
                kind: "manual",
                label: "Manual entry",
            },
            normalized_resume: body.normalizedResume ?? {
                rawText: body.resumeText ?? "",
            },
        })
        .select("id, name")
        .single();

    if (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data, { status: 201 });
}
