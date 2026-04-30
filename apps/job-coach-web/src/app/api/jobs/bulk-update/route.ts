import { createServerClient } from "@coach/db";
import { DbJobRepository } from "@coach/db";

function createJobRepository() {
  return new DbJobRepository(createServerClient());
}

export async function POST(request: Request) {
  try {
    const { ids, status } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      return Response.json(
        { error: "INVALID_BULK_UPDATE_INPUT" },
        { status: 400 }
      );
    }

    const jobRepository = createJobRepository();

    await Promise.all(
      ids.map((jobId: string) =>
        jobRepository.updateJobStatus({
          jobId,
          status,
        })
      )
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error("Bulk update failed:", err);
    return Response.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
