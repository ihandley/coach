import {
  createServerClient,
  DbJobRepository,
} from "@coach/db";

export async function GET() {
  const db = createServerClient();
  const jobRepo = new DbJobRepository(db);

  const jobs = await jobRepo.listJobs();

  const { data: matches, error } = await db
    .from("job_matches")
    .select("job_id, score");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const matchMap = new Map(
    (matches ?? []).map((match: any) => [match.job_id, match.score])
  );

  const ranked = jobs
    .map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      status: job.status,
      sourceUrl: job.sourceUrl,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      score: matchMap.get(job.id) ?? 0,
    }))
    .sort((a: any, b: any) => b.score - a.score);

  return Response.json(ranked);
}
