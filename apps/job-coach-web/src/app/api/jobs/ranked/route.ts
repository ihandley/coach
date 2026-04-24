import { calculateFit } from "@/server/match/calculate-fit";
import { getDb } from "@/server/db/client";

export async function GET() {
    const db = getDb();

    const jobs = await db.jobRepo.listJobs?.() ?? [];

    const resumes = await db.resumeRepo?.listResumeProfiles?.() ?? [];

    const resume = resumes[0] ?? { rawText: "" };

    const ranked = jobs
        .map((job: any) => ({
            ...job,
            score: calculateFit(job, resume).score,
        }))
        .sort((a: any, b: any) => b.score - a.score);

    return Response.json(ranked);
}
