import { DbJobRepository } from "@coach/db";

const jobRepository = new DbJobRepository({} as never);

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

export async function POST(
    request: Request,
    context: { params: { jobId: string } },
) {
    const body = await request.json();

    if (!body || !isNonEmptyString(body.note)) {
        return Response.json(
            { error: "INVALID_JOB_NOTE_INPUT" },
            { status: 400 },
        );
    }

    const result = await jobRepository.addApplicationEvent({
        jobId: context.params.jobId,
        type: "note_added",
        note: body.note,
    });

    return Response.json(result);
}
