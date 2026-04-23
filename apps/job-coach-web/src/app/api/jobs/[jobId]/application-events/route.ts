import { DbJobRepository } from "@coach/db";

const jobRepository = new DbJobRepository({} as never);

export async function GET(
    _request: Request,
    context: { params: { jobId: string } },
) {
    const applicationEvents = await jobRepository.listApplicationEvents(
        context.params.jobId,
    );

    return Response.json(applicationEvents);
}
