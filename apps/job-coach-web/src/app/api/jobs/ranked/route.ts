import { createServerClient, DbJobRepository } from "@coach/db";

import { compareRankedJobSignals } from "@/lib/jobs-table-signals";

type JobMatchRow = {
  job_id: string;
  score: unknown;
};

export function normalizeRankedScore(score: unknown) {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return null;
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

  const { data: matches } = await db.from("job_matches").select("job_id, score");

  const matchMap = new Map<string, number>();

  for (const match of (matches || []) as JobMatchRow[]) {
    const normalizedScore = normalizeRankedScore(match.score);

    if (normalizedScore !== null) {
      matchMap.set(match.job_id, normalizedScore);
    }
  }

  const ranked = jobs
    .map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      status: job.status,
      sourceUrl: job.sourceUrl,
      sourceText: job.sourceText,
      structuredSummary: job.structuredSummary,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      score: matchMap.has(job.id) ? matchMap.get(job.id)! : null,
    }))
    .sort(compareRankedJobSignals);

  return Response.json(ranked);
}
