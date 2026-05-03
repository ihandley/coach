import {
  createServerClient,
  DbJobRepository,
} from "@coach/db";

export function normalizeRankedScore(score: unknown) {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return 0;
  }

  return Math.max(0, Math.min(score / 100, 1));
}

export async function GET() {
  let db;

  try {
    db = createServerClient();
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Missing SUPABASE_URL" ||
        error.message === "Missing SUPABASE_SERVICE_ROLE_KEY")
    ) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    throw error;
  }

  const jobRepo = new DbJobRepository(db);

  const jobs = await jobRepo.listJobs();

  const { data: matches } = await db
    .from("job_matches")
    .select("job_id, score");

  const matchMap = new Map(
    (matches || []).map((m: any) => [m.job_id, normalizeRankedScore(m.score)])
  );

  const ranked = jobs
    .map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      status: job.status,
      sourceUrl: job.sourceUrl,
      sourceText: job.sourceText,
      structuredSummary: job.structuredSummary,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      score: matchMap.get(job.id) ?? 0,
    }))
    .sort((a: any, b: any) => b.score - a.score);

  return Response.json(ranked);
}
