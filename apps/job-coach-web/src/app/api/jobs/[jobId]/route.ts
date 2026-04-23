import { DbJobRepository } from "@coach/db";

const jobRepository = new DbJobRepository({} as never);

export async function GET(
    _request: Request,
    context: { params: { jobId: string } },
) {
    const jobs = await jobRepository.listJobs();
    const job = jobs.find((candidate) => candidate.id === context.params.jobId);

    if (!job) {
        return Response.json(
            { error: "JOB_NOT_FOUND" },
            { status: 404 },
        );
    }

    return Response.json({
        id: job.id,
        company: job.company,
        title: job.title,
        sourceUrl: job.sourceUrl,
        sourceText: job.sourceText,
        status: job.status,
    });
}
