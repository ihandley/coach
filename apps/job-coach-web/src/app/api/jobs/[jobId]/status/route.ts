import { createServerClient } from "@coach/db";
import { DbJobRepository } from "@coach/db";

function createJobRepository() {
  return new DbJobRepository(createServerClient());
}

export async function POST(
  request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  const body = await request.json();

  const { status } = body;

  if (!status) {
    return Response.json(
      { error: "INVALID_JOB_STATUS_INPUT" },
      { status: 400 }
    );
  }

  const jobRepository = createJobRepository();

  const updated = await jobRepository.updateJobStatus({
    jobId,
    status,
  });

  return Response.json(updated);
}
