import { createServerClient, DbJobRepository } from "@coach/db";

import { compareRankedJobSignals } from "@/lib/jobs-table-signals";

type JobMatchRow = {
  job_id: string;
  score: unknown;
};

type RankedMatchDetails = {
  strengths: string[];
  gaps: string[];
  reasons: string[];
};

export function normalizeRankedScore(score: unknown) {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return null;
  }

  return Math.max(0, Math.min(score / 100, 1));
}

export function createRankedMatchDetails(score: number): RankedMatchDetails {
  const reason = score > 30 ? "Good keyword overlap" : "Low keyword overlap";

  return {
    strengths: score > 30 ? [reason] : [],
    gaps: score > 30 ? [] : [reason],
    reasons: [reason],
  };
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

  const matchMap = new Map<string, { score: number; matchDetails: RankedMatchDetails }>();

  for (const match of (matches || []) as JobMatchRow[]) {
    const normalizedScore = normalizeRankedScore(match.score);

    if (normalizedScore !== null) {
      matchMap.set(match.job_id, {
        score: normalizedScore,
        matchDetails: createRankedMatchDetails(match.score as number),
      });
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
      score: matchMap.get(job.id)?.score ?? null,
      matchDetails: matchMap.get(job.id)?.matchDetails ?? null,
    }))
    .sort(compareRankedJobSignals);

  return Response.json(ranked);
}
