import { createServerClient, DbJobRepository } from "@coach/db";

import { compareRankedJobSignals } from "@/lib/jobs-table-signals";

type JobMatchRow = {
  job_id: string;
  score: unknown;
  match_details?: unknown;
};

type RankedMatchDetails = {
  strengths: string[];
  gaps: string[];
  reasons: string[];
  recommendation?: string;
};

export function normalizeRankedScore(score: unknown) {
  if (typeof score !== "number" || Number.isNaN(score)) {
    return null;
  }

  return Math.max(0, Math.min(score / 100, 1));
}

function getStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function normalizeMatchDetails(value: unknown): RankedMatchDetails | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const details = value as Record<string, unknown>;
  const strengths = getStringArray(details.strengths);
  const gaps = getStringArray(details.gaps);
  const reasons = getStringArray(details.reasons);
  const recommendation =
    typeof details.recommendation === "string" && details.recommendation.trim().length > 0
      ? details.recommendation
      : undefined;

  if (strengths.length === 0 && gaps.length === 0 && reasons.length === 0 && !recommendation) {
    return null;
  }

  return { strengths, gaps, reasons, recommendation };
}

type RankedJobSource = {
  title?: string;
  company?: string;
  sourceText?: string | null;
  structuredSummary?: unknown;
};

function formatFallbackTerm(value: string) {
  return value
    .replace(/^[^a-z0-9+#]+|[^a-z0-9+#]+$/gi, "")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getFallbackTerms(job: RankedJobSource) {
  const summary = job.structuredSummary as Record<string, unknown> | null | undefined;
  const requirements = Array.isArray(summary?.requirements)
    ? summary.requirements.filter((item): item is string => typeof item === "string")
    : [];
  const sourceTerms = (job.sourceText ?? "")
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/i)
    .filter((term) => term.length > 2 && !["and", "for", "the", "with", "you"].includes(term));

  return Array.from(new Set([...requirements.flatMap((item) => item.split(/\W+/)), ...sourceTerms]))
    .filter(Boolean)
    .slice(0, 5)
    .map(formatFallbackTerm);
}

export function createRankedMatchDetails(score: number, job: RankedJobSource): RankedMatchDetails {
  const title = job.title?.trim() || "this role";
  const terms = getFallbackTerms(job);
  const termText = terms.length > 0 ? terms.join(", ") : "the saved job requirements";
  const recommendation =
    score >= 80
      ? `Strong fit for ${title}. Prioritize this role and tailor the resume around ${termText}.`
      : score >= 60
        ? `Good fit for ${title}. Worth applying with a tailored resume that reinforces ${termText}.`
        : score >= 40
          ? `Moderate fit for ${title}. Consider applying if the role is interesting, but tailor carefully around ${termText}.`
          : `Weak fit for ${title}. Apply only if there is strong interest or missing resume context.`;

  return {
    strengths:
      score >= 40 ? [`Saved fit score suggests relevant overlap with ${title} requirements.`] : [],
    gaps:
      score < 60
        ? [`Review resume evidence for ${termText}; the saved fit score indicates possible gaps.`]
        : [],
    reasons: [`Fit analysis is based on the saved match score and ${title} posting data.`],
    recommendation,
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

  const { data: matches } = await db.from("job_matches").select("job_id, score, match_details");

  const matchMap = new Map<string, { score: number; matchDetails: RankedMatchDetails | null }>();

  for (const match of (matches || []) as JobMatchRow[]) {
    const normalizedScore = normalizeRankedScore(match.score);

    if (normalizedScore !== null) {
      matchMap.set(match.job_id, {
        score: normalizedScore,
        matchDetails: normalizeMatchDetails(match.match_details),
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
      matchDetails:
        matchMap.get(job.id)?.matchDetails ??
        (matchMap.has(job.id)
          ? createRankedMatchDetails(matchMap.get(job.id)!.score * 100, job)
          : null),
    }))
    .sort(compareRankedJobSignals);

  return Response.json(ranked);
}
