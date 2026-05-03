import { createDbGenerateTailoringSuggestions, createServerClient } from "@coach/db";
import { generateResumeTailoringSuggestions } from "@/server/resume-tailoring/generate-tailoring-suggestions";

const generateTailoringSuggestions = createDbGenerateTailoringSuggestions({
  resumeProfiles: {
    async getResumeProfileById(resumeProfileId: string) {
      const db = createServerClient();
      const { data, error } = await db
        .from("resume_profiles")
        .select("id,name,current_version_id")
        .eq("id", resumeProfileId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data
        ? {
            id: data.id,
            name: data.name,
            currentVersionId: data.current_version_id ?? "",
          }
        : null;
    },
  },
  resumeVersions: {
    async getResumeVersionById(resumeVersionId: string) {
      const db = createServerClient();
      const { data, error } = await db
        .from("resume_versions")
        .select("id,resume_profile_id,version_number,normalized_resume")
        .eq("id", resumeVersionId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data
        ? {
            id: data.id,
            profileId: data.resume_profile_id,
            versionNumber: data.version_number ?? 1,
            normalizedResume: data.normalized_resume,
          }
        : null;
    },
  },
  generateSuggestions: async ({ jobId, sourceResume }) => {
    const db = createServerClient();
    const { data: job, error } = await db
      .from("jobs")
      .select("title,company,source_text,structured_summary")
      .eq("id", jobId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!job) {
      throw new Error("JOB_NOT_FOUND");
    }

    return generateResumeTailoringSuggestions({
      job: {
        title: job.title,
        company: job.company,
        sourceText: job.source_text,
        structuredSummary: job.structured_summary,
      },
      sourceResume,
    });
  },
});

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  const { id: resumeProfileId } = await context.params;
  const body = await request.json();

  if (!body || !isNonEmptyString(body.jobId) || !isNonEmptyString(body.sourceResumeVersionId)) {
    return Response.json({ error: "INVALID_TAILORING_SUGGESTIONS_INPUT" }, { status: 400 });
  }

  try {
    const result = await generateTailoringSuggestions({
      profileId: resumeProfileId,
      jobId: body.jobId,
      sourceResumeVersionId: body.sourceResumeVersionId,
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "RESUME_PROFILE_NOT_FOUND") {
      return Response.json({ error: "RESUME_PROFILE_NOT_FOUND" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "RESUME_VERSION_NOT_FOUND") {
      return Response.json({ error: "RESUME_VERSION_NOT_FOUND" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "INVALID_TAILORING_SUGGESTIONS") {
      return Response.json({ error: "INVALID_TAILORING_SUGGESTIONS" }, { status: 400 });
    }

    if (error instanceof Error && error.message === "JOB_NOT_FOUND") {
      return Response.json({ error: "JOB_NOT_FOUND" }, { status: 404 });
    }

    if (error instanceof Error && error.message === "RESUME_VERSION_PROFILE_MISMATCH") {
      return Response.json({ error: "RESUME_VERSION_PROFILE_MISMATCH" }, { status: 400 });
    }

    throw error;
  }
}
