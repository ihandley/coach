import { DbJobRepository } from "@coach/db";

function createJobRepository() {
    return new DbJobRepository({} as never);
}

export async function GET(
    _request: Request,
    context: { params: Promise<{ jobId: string }> },
) {
    const { jobId } = await context.params;
    const jobRepository = createJobRepository();

    const applicationEvents = await jobRepository.listApplicationEvents(jobId);

    return Response.json(applicationEvents);
}
