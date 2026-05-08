import { applyJobReimport, JobReimportError } from "@/server/jobs/reimport-job";

export async function PATCH(request: Request, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;
  const body = await request.json().catch(() => ({}));

  try {
    const result = await applyJobReimport({
      jobId,
      company: body?.company,
      title: body?.title,
      sourceText: body?.sourceText,
      structuredSummary: body?.structuredSummary,
      sourceUrl: body?.sourceUrl,
      resumeProfileId: body?.resumeProfileId,
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof JobReimportError) {
      return Response.json({ error: error.code }, { status: error.status });
    }

    throw error;
  }
}
