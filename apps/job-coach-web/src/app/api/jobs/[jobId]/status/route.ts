import { DbJobRepository } from "@coach/db";

function createJobRepository() {
    return new DbJobRepository({} as never);
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

export async function POST(
    request: Request,
    context: { params: Promise<{ jobId: string }> },
) {
    const { jobId } = await context.params;
    const body = await request.json();

    if (!body || !isNonEmptyString(body.status)) {
        return Response.json(
            { error: "INVALID_JOB_STATUS_INPUT" },
            { status: 400 },
        );
    }

    const jobRepository = createJobRepository();

    const result = await jobRepository.updateJobStatus({
        jobId,
        status: body.status,
    });

    return Response.json(result);
}
