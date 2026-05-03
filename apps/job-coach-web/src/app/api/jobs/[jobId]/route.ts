import { createServerClient } from "@coach/db";
import { DbJobRepository } from "@coach/db";

function createJobRepository() {
  return new DbJobRepository(createServerClient());
}

export async function GET(_request: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const jobRepository = createJobRepository();

  const jobs = await jobRepository.listJobs();
  const job = jobs.find((candidate: { id: string }) => candidate.id === jobId);

  if (!job) {
    return Response.json({ error: "JOB_NOT_FOUND" }, { status: 404 });
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

export async function PATCH(req: Request, context: { params: Promise<{ jobId: string }> }) {
  const body = await req.json();
  const { jobId } = await context.params;
  const jobRepository = createJobRepository();

  const job = await jobRepository.updateJobStatus({
    jobId,
    status: body.status,
    event: {
      type: "status_changed",
      note: `Status set to ${body.status}`,
    },
  });

  return Response.json(job);
}
