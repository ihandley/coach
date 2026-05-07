import { JobReimportError, previewJobReimport } from "@/server/jobs/reimport-job";

export async function POST(request: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const body = await request.json().catch(() => ({}));

  try {
    const preview = await previewJobReimport(
      jobId,
      typeof body?.sourceUrl === "string" ? body.sourceUrl : undefined,
    );

    return Response.json(preview);
  } catch (error) {
    if (error instanceof JobReimportError) {
      return Response.json({ error: error.code }, { status: error.status });
    }

    throw error;
  }
}
