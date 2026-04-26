import { getSupabaseClient } from "@/server/supabase/client";
import { DbJobRepository } from "@coach/db";

function createJobRepository() {
  return new DbJobRepository(getSupabaseClient());
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  const jobRepository = createJobRepository();

  const job = await jobRepository.getJobById(jobId);

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
