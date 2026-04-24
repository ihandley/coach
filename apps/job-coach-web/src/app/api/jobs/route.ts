import { DbJobRepository } from "@coach/db";

const jobRepository = new DbJobRepository({} as never);

export async function GET(_request: Request) {
    const jobs = await jobRepository.listJobs();

    return Response.json(
        jobs.map((job) => ({
            id: job.id,
            company: job.company,
            title: job.title,
            status: job.status,
            updatedAt: job.updatedAt,
        })),
    );
}
