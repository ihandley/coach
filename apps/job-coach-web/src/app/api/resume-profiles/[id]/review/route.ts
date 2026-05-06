import { createBaselineResumeReview, type NormalizedResume } from "@coach/core";
import { createServerClient } from "@coach/db";

async function getCurrentResumeVersion(
  db: ReturnType<typeof createServerClient>,
  resumeProfileId: string,
) {
  const { data: profile, error: profileError } = await db
    .from("resume_profiles")
    .select("id,current_version_id")
    .eq("id", resumeProfileId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!profile?.current_version_id) {
    return null;
  }

  const { data: version, error: versionError } = await db
    .from("resume_versions")
    .select("id,normalized_resume")
    .eq("id", profile.current_version_id)
    .maybeSingle();

  if (versionError) {
    throw versionError;
  }

  return version;
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const { id: resumeProfileId } = await context.params;

  const db = createServerClient();
  const version = await getCurrentResumeVersion(db, resumeProfileId);

  if (!version) {
    return Response.json({ error: "RESUME_PROFILE_NOT_FOUND" }, { status: 404 });
  }

  const review = await createBaselineResumeReview(version.normalized_resume as NormalizedResume);

  return Response.json({
    id: resumeProfileId,
    resumeVersionId: version.id,
    review,
  });
}
