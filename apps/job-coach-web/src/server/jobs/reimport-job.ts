import { cleanJobText, type JobRecord, type JobStatus } from "@coach/core";
import { fetchJobPageAsDependency, extractJobStub } from "@coach/ai";
import { createServerClient, DbJobRepository } from "@coach/db";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateStructuredSummary } from "@/server/ai/structured-job-summary";
import { calculateFit } from "@/server/match/calculate-fit";
import { normalizedResumeToText } from "@/server/match/normalized-resume-to-text";

type JobRow = {
  id: string;
  company: string;
  title: string;
  source_url: string;
  source_text: string;
  structured_summary: unknown | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type ResumeProfile = {
  id: string;
  normalized_resume: unknown | null;
  created_at: string;
};

type ResumeVersion = {
  normalized_resume: unknown | null;
  created_at: string;
};

export type ApplyJobReimportInput = {
  jobId: string;
  company: string;
  title: string;
  sourceText: string;
  structuredSummary?: unknown;
  sourceUrl?: string;
  resumeProfileId?: string;
};

export class JobReimportError extends Error {
  constructor(
    readonly code:
      | "JOB_NOT_FOUND"
      | "INVALID_SOURCE_URL"
      | "FAILED_TO_FETCH_JOB_PAGE"
      | "INVALID_EXTRACTED_JOB_DATA"
      | "INVALID_REIMPORT_INPUT",
    readonly status: number,
  ) {
    super(code);
    this.name = "JobReimportError";
  }
}

export async function previewJobReimport(jobId: string, sourceUrlOverride?: string) {
  const db = createServerClient();
  const repo = new DbJobRepository(db);
  const currentJob = await repo.getJobById(jobId);

  if (!currentJob) {
    throw new JobReimportError("JOB_NOT_FOUND", 404);
  }

  const sourceUrl = normalizeSourceUrl(sourceUrlOverride ?? currentJob.sourceUrl);

  let page;
  try {
    page = await fetchJobPageAsDependency(sourceUrl);
  } catch (error) {
    if (error instanceof Error && error.name === "FetchJobPageError") {
      throw new JobReimportError("FAILED_TO_FETCH_JOB_PAGE", 400);
    }

    throw error;
  }

  const extracted = await extractJobStub(page);
  const company = extracted.company.trim();
  const title = extracted.title.trim();
  const sourceText = cleanJobText(extracted.rawDescription);

  if (!company || !title || !sourceText) {
    throw new JobReimportError("INVALID_EXTRACTED_JOB_DATA", 422);
  }

  const structuredSummary = await generateSummaryOrNull(sourceText);

  return {
    jobId,
    sourceUrl,
    current: formatPreviewJob(currentJob),
    preview: {
      company,
      title,
      sourceText,
      structuredSummary,
    },
  };
}

export async function applyJobReimport(input: ApplyJobReimportInput) {
  const company = normalizeRequiredString(input.company);
  const title = normalizeRequiredString(input.title);
  const sourceText = normalizeRequiredString(input.sourceText);

  if (!company || !title || !sourceText) {
    throw new JobReimportError("INVALID_REIMPORT_INPUT", 400);
  }

  const db = createServerClient();
  const repo = new DbJobRepository(db);
  const currentJob = await repo.getJobById(input.jobId);

  if (!currentJob) {
    throw new JobReimportError("JOB_NOT_FOUND", 404);
  }

  const sourceUrl =
    input.sourceUrl === undefined || input.sourceUrl === ""
      ? currentJob.sourceUrl
      : normalizeSourceUrl(input.sourceUrl);
  const structuredSummary =
    input.structuredSummary === undefined || input.structuredSummary === null
      ? await generateSummaryOrNull(sourceText)
      : input.structuredSummary;

  const { data, error } = await db
    .from("jobs")
    .update({
      company,
      title,
      source_url: sourceUrl,
      source_text: sourceText,
      structured_summary: structuredSummary,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.jobId)
    .select(
      `
      id,
      company,
      title,
      source_url,
      source_text,
      structured_summary,
      status,
      created_at,
      updated_at
    `,
    )
    .single<JobRow>();

  if (error) {
    throw error;
  }

  const job = mapJobRow(data);
  const match = await upsertJobMatch(db, job, input.resumeProfileId);

  return {
    job,
    match,
  };
}

export function isRealSourceUrl(value: string | undefined | null): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeSourceUrl(value: string | undefined | null) {
  if (!isRealSourceUrl(value)) {
    throw new JobReimportError("INVALID_SOURCE_URL", 400);
  }

  return value.trim();
}

function normalizeRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function generateSummaryOrNull(sourceText: string) {
  try {
    return await generateStructuredSummary(sourceText);
  } catch (error) {
    console.error("AI summary failed", error);
    return null;
  }
}

function formatPreviewJob(job: JobRecord) {
  return {
    company: job.company,
    title: job.title,
    sourceText: job.sourceText,
    structuredSummary: job.structuredSummary ?? null,
  };
}

async function upsertJobMatch(
  db: SupabaseClient,
  job: JobRecord,
  resumeProfileId: string | undefined,
) {
  const { resumeProfileId: resolvedResumeProfileId, resumeText } = await getResumeText(
    db,
    resumeProfileId,
  );
  const result = calculateFit(job, { rawText: resumeText });

  const { error } = await db.from("job_matches").upsert({
    job_id: job.id,
    resume_profile_id: resolvedResumeProfileId,
    score: result.score,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }

  return {
    ...result,
    resumeProfileId: resolvedResumeProfileId,
  };
}

async function getResumeText(db: SupabaseClient, resumeProfileId: string | undefined) {
  let profileQuery = db.from("resume_profiles").select("id, normalized_resume, created_at");

  if (resumeProfileId && resumeProfileId !== "default") {
    profileQuery = profileQuery.eq("id", resumeProfileId);
  }

  const { data: profile, error: profileError } = await profileQuery
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ResumeProfile>();

  if (profileError) {
    throw profileError;
  }

  if (!profile) {
    return { resumeProfileId: null, resumeText: "" };
  }

  if (profile.normalized_resume) {
    return {
      resumeProfileId: profile.id,
      resumeText: normalizedResumeToText(profile.normalized_resume),
    };
  }

  const { data: version, error: versionError } = await db
    .from("resume_versions")
    .select("normalized_resume, created_at")
    .eq("resume_profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ResumeVersion>();

  if (versionError) {
    throw versionError;
  }

  return {
    resumeProfileId: profile.id,
    resumeText: version?.normalized_resume ? normalizedResumeToText(version.normalized_resume) : "",
  };
}

function mapJobRow(row: JobRow): JobRecord {
  return {
    id: row.id,
    company: row.company,
    title: row.title,
    sourceUrl: row.source_url,
    sourceText: row.source_text,
    structuredSummary: row.structured_summary ?? null,
    status: row.status as JobStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
