import { createCoverLetterDraft, InMemoryCoverLetterDraftRepository } from "@coach/core";
import { createServerClient, DbJobRepository } from "@coach/db";

interface FromJobBody {
  jobId: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseBody(value: unknown): FromJobBody | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const body = value as Record<string, unknown>;

  if (!isNonEmptyString(body.jobId)) {
    return null;
  }

  return {
    jobId: body.jobId,
  };
}

async function getCurrentResumeProfile(
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
    return {
      profile,
      currentVersion: null,
    };
  }

  const { data: version, error: versionError } = await db
    .from("resume_versions")
    .select("id,normalized_resume")
    .eq("id", profile.current_version_id)
    .maybeSingle();

  if (versionError) {
    throw versionError;
  }

  return {
    profile,
    currentVersion: version
      ? {
          id: version.id,
          normalizedResume: version.normalized_resume,
        }
      : null,
  };
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

  const json = await request.json().catch(() => null);
  const body = parseBody(json);

  if (!body) {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const db = createServerClient();
  const jobs = new DbJobRepository(db);
  const resumeProfileResult = await getCurrentResumeProfile(db, resumeProfileId);

  const resumeProfile = resumeProfileResult?.profile ?? null;
  const resumeVersion = resumeProfileResult?.currentVersion ?? null;
  const job = await jobs.getJobById(body.jobId);

  if (!resumeProfile || !resumeVersion || !job) {
    return Response.json({ error: "Required data not found" }, { status: 404 });
  }

  const normalizedResume = resumeVersion.normalizedResume as {
    basics?: {
      fullName?: string;
      summary?: string;
    };
  };

  const repository = new InMemoryCoverLetterDraftRepository();

  const jobSummary =
    "summary" in job && typeof job.summary === "string" ? job.summary : job.sourceText;

  const draft = await createCoverLetterDraft(repository, {
    resumeProfileId,
    jobId: body.jobId,
    candidateName: normalizedResume.basics?.fullName ?? "Candidate",
    companyName: job.company,
    jobTitle: job.title,
    jobSummary,
    resumeSummary: normalizedResume.basics?.summary ?? "",
  });

  return Response.json(
    {
      ...draft,
      createdAt: draft.createdAt.toISOString(),
    },
    { status: 201 },
  );
}
