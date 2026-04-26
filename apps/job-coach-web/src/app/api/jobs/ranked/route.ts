import { calculateFit } from "@/server/match/calculate-fit";
import {
  createServerClient,
  DbJobRepository,
  createDbResumeProfileRepository,
  createDbResumeVersionRepository,
} from "@coach/db";

function normalizedResumeToText(normalizedResume: any): string {
  const parts = [];

  if (normalizedResume.basics) {
    parts.push(normalizedResume.basics.fullName);
    parts.push(normalizedResume.basics.headline);
    parts.push(normalizedResume.basics.summary);
  }

  if (normalizedResume.skills) {
    parts.push(normalizedResume.skills.join(" "));
  }

  if (normalizedResume.experience) {
    for (const exp of normalizedResume.experience) {
      parts.push(exp.company);
      parts.push(exp.title);
      if (exp.highlights) {
        parts.push(exp.highlights.join(" "));
      }
    }
  }

  return parts.filter(Boolean).join(" ");
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
  const resumeRepo = createDbResumeProfileRepository({ db });
  const resumeVersionRepo = createDbResumeVersionRepository({ db });

  const jobs = await jobRepo.listJobs();
  const resumeProfiles = await resumeRepo.listResumeProfiles();

  let resumeText = "";
  if (resumeProfiles.length > 0) {
    const profile = resumeProfiles[0];
    if (profile.currentVersionId) {
      try {
        const currentVersion =
          await resumeVersionRepo.getResumeVersionById(
            profile.currentVersionId
          );
        if (currentVersion) {
          resumeText = normalizedResumeToText(
            currentVersion.normalizedResume
          );
        }
      } catch (error) {
        console.error("Error fetching resume version:", error);
      }
    }
  }

  const resume = { rawText: resumeText };

  const ranked = jobs
    .map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      status: job.status,
      sourceUrl: job.sourceUrl,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      score: calculateFit(job, resume).score,
    }))
    .sort((a: any, b: any) => b.score - a.score);

  return Response.json(ranked);
}
