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

  if (typeof body.company === "string" || typeof body.title === "string") {
    const update: { company?: string; title?: string; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.company === "string") {
      const company = body.company.trim();

      if (!company) {
        return Response.json({ error: "INVALID_COMPANY" }, { status: 400 });
      }

      update.company = company;
    }

    if (typeof body.title === "string") {
      const title = body.title.trim();

      if (!title) {
        return Response.json({ error: "INVALID_TITLE" }, { status: 400 });
      }

      update.title = title;
    }

    const db = createServerClient();
    const { data, error } = await db
      .from("jobs")
      .update(update)
      .eq("id", jobId)
      .select("id, company, title")
      .single();

    if (error) {
      console.error(error);
      return Response.json({ error: "UPDATE_JOB_DETAILS_FAILED" }, { status: 500 });
    }

    return Response.json(data);
  }

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

export async function DELETE(_request: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const jobRepository = createJobRepository();

  await jobRepository.deleteJob(jobId);

  return new Response(null, { status: 204 });
}
