import type { SupabaseClient } from "@supabase/supabase-js";
import { DbJobRepository } from "@coach/db";
import { calculateFit } from "./calculate-fit";
import { normalizedResumeToText } from "./normalized-resume-to-text";

type ResumeProfile = {
  id: string;
  normalized_resume: unknown | null;
  current_version_id: string | null;
  created_at: string;
};

type ResumeVersion = {
  id: string;
  resume_profile_id: string;
  normalized_resume: unknown | null;
  created_at: string;
};

type BackfillJobMatchesOptions = {
  resumeProfileId?: string | null;
  resumeVersionId?: string | null;
};

async function getResumeVersionText(db: SupabaseClient, resumeVersionId: string) {
  const { data: version, error } = await db
    .from("resume_versions")
    .select("id, resume_profile_id, normalized_resume, created_at")
    .eq("id", resumeVersionId)
    .maybeSingle<ResumeVersion>();

  if (error) throw error;

  return version
    ? {
        resumeProfileId: version.resume_profile_id,
        resumeVersionId: version.id,
        resumeText: version.normalized_resume
          ? normalizedResumeToText(version.normalized_resume)
          : "",
      }
    : null;
}

async function getResumeText(db: SupabaseClient, options: BackfillJobMatchesOptions = {}) {
  if (options.resumeVersionId) {
    const version = await getResumeVersionText(db, options.resumeVersionId);

    return (
      version ?? {
        resumeProfileId: options.resumeProfileId ?? null,
        resumeVersionId: null,
        resumeText: "",
      }
    );
  }

  let profileQuery = db
    .from("resume_profiles")
    .select("id, normalized_resume, current_version_id, created_at");

  if (options.resumeProfileId) {
    profileQuery = profileQuery.eq("id", options.resumeProfileId);
  }

  const { data: profile, error: profileError } = await profileQuery
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ResumeProfile>();

  if (profileError) throw profileError;

  if (!profile) {
    return {
      resumeProfileId: options.resumeProfileId ?? null,
      resumeVersionId: null,
      resumeText: "",
    };
  }

  if (profile.current_version_id) {
    const version = await getResumeVersionText(db, profile.current_version_id);

    if (version) {
      return version;
    }
  }

  if (profile.normalized_resume) {
    return {
      resumeProfileId: profile.id,
      resumeVersionId: null,
      resumeText: normalizedResumeToText(profile.normalized_resume),
    };
  }

  const { data: version, error: versionError } = await db
    .from("resume_versions")
    .select("id, resume_profile_id, normalized_resume, created_at")
    .eq("resume_profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<ResumeVersion>();

  if (versionError) throw versionError;

  return {
    resumeProfileId: profile.id,
    resumeVersionId: version?.id ?? null,
    resumeText: version?.normalized_resume ? normalizedResumeToText(version.normalized_resume) : "",
  };
}

export async function backfillJobMatches(
  db: SupabaseClient,
  options: BackfillJobMatchesOptions = {},
) {
  const jobRepo = new DbJobRepository(db);
  const jobs = await jobRepo.listJobs();
  const { resumeProfileId, resumeVersionId, resumeText } = await getResumeText(db, options);

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
    return { updated: 0, resumeProfileId, resumeVersionId };
  }

  const { error } = await db.from("job_matches").upsert(rows);

  if (error) throw error;

  return { updated: rows.length, resumeProfileId, resumeVersionId };
}
