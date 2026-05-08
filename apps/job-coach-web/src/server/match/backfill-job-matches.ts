import type { SupabaseClient } from "@supabase/supabase-js";
import { DbJobRepository } from "@coach/db";
import { calculateFit } from "./calculate-fit";
import { normalizedResumeToText } from "./normalized-resume-to-text";

type ResumeProfile = {
  id: string;
  normalized_resume: unknown | null;
  created_at: string;
};

type ResumeVersion = {
  normalized_resume: unknown | null;
  created_at: string;
};

async function getLatestResumeText(db: SupabaseClient) {
  const { data: profile, error: profileError } = await db
    .from("resume_profiles")
    .select("id, normalized_resume, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ResumeProfile>();

  if (profileError) throw profileError;

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

  if (versionError) throw versionError;

  return {
    resumeProfileId: profile.id,
    resumeText: version?.normalized_resume ? normalizedResumeToText(version.normalized_resume) : "",
  };
}

export async function backfillJobMatches(db: SupabaseClient) {
  const jobRepo = new DbJobRepository(db);
  const jobs = await jobRepo.listJobs();
  const { resumeProfileId, resumeText } = await getLatestResumeText(db);

  const rows = jobs.map((job: any) => {
    const result = calculateFit(job, { rawText: resumeText });

    return {
      job_id: job.id,
      resume_profile_id: resumeProfileId,
      score: result.score,
      match_details: result.matchDetails,
      created_at: new Date().toISOString(),
    };
  });

  if (rows.length === 0) {
    return { updated: 0, resumeProfileId };
  }

  const { error } = await db.from("job_matches").upsert(rows);

  if (error) throw error;

  return { updated: rows.length, resumeProfileId };
}
