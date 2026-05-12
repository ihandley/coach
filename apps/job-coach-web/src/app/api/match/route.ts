import { normalizedResumeToText } from "@/server/match/normalized-resume-to-text";
import { calculateFit } from "../../../server/match/calculate-fit";
import { createServerClient, DbJobRepository } from "@coach/db";

export async function POST(request: Request) {
  const body = await request.json();

  if (!body?.jobId || !body?.resumeProfileId) {
    return Response.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

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

  const job = await jobRepo.getJobById(body.jobId);

  if (!job) {
    return Response.json({ error: "JOB_NOT_FOUND" }, { status: 404 });
  }

  let resumeText = "";

  let profileQuery = db.from("resume_profiles").select("id, normalized_resume, created_at");

  if (body.resumeProfileId !== "default") {
    profileQuery = profileQuery.eq("id", body.resumeProfileId);
  }

  const { data: profile, error: profileError } = await profileQuery
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (profile?.normalized_resume) {
    resumeText = normalizedResumeToText(profile.normalized_resume);
  } else if (profile?.id) {
    const { data: version, error: versionError } = await db
      .from("resume_versions")
      .select("normalized_resume, created_at")
      .eq("resume_profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (versionError) {
      throw versionError;
    }

    if (version?.normalized_resume) {
      resumeText = normalizedResumeToText(version.normalized_resume);
    }
  }

  const result = calculateFit(job, { rawText: resumeText });

  // Persist match result
  const { error: upsertError } = await db.from("job_matches").upsert({
    job_id: body.jobId,
    resume_profile_id: profile?.id ?? null,
    score: result.score,
    match_details: result.matchDetails,
    created_at: new Date().toISOString(),
  });

  if (upsertError) {
    throw upsertError;
  }

  return Response.json(result);
}
