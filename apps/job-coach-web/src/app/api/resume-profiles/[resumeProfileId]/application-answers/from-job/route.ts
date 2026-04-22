import { createApplicationAnswer } from "@coach/core";
import { createDbGetResumeProfile, DbJobRepository } from "@coach/db";

interface FromJobBody {
    jobId: string;
    question: string;
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function parseBody(value: unknown): FromJobBody | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const body = value as Record<string, unknown>;

    if (!isNonEmptyString(body.jobId) || !isNonEmptyString(body.question)) {
        return null;
    }

    return {
        jobId: body.jobId,
        question: body.question,
    };
}

export async function POST(
    request: Request,
    context: {
        params: Promise<{
            resumeProfileId: string;
        }>;
    },
) {
    const { resumeProfileId } = await context.params;

    const json = await request.json().catch(() => null);
    const body = parseBody(json);

    if (!body) {
        return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const getResumeProfile = createDbGetResumeProfile({} as never);
    const jobs = new DbJobRepository({} as never);

    const resumeProfileResult = await getResumeProfile({
        resumeProfileId,
    });

    const resumeVersion = resumeProfileResult?.currentVersion ?? null;
    const job = await jobs.getJobById(body.jobId);

    if (!resumeVersion || !job) {
        return Response.json({ error: "Required data not found" }, { status: 404 });
    }

    const normalizedResume = resumeVersion.normalizedResume as {
        basics?: {
            fullName?: string;
            summary?: string;
        };
    };

    const result = await createApplicationAnswer({
        question: body.question,
        candidateName: normalizedResume.basics?.fullName ?? "Candidate",
        companyName: job.company,
        jobTitle: job.title,
        jobSummary: job.sourceText,
        resumeSummary: normalizedResume.basics?.summary ?? "",
    });

    return Response.json(result, { status: 201 });
}