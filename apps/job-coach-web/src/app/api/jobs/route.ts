import { cleanJobText, extractJobFields } from "@coach/core";
import { createDbJobImporter, DbJobRepository, createServerClient } from "@coach/db";
import { fetchJobPageAsDependency, extractJobStub } from "@coach/ai";

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

export async function GET() {
    const db = createServerClient();
    const repo = new DbJobRepository(db);

    const jobs = await repo.listJobs();

    return Response.json(jobs);
}

export async function POST(request: Request) {
    const body = await request.json();
    const db = createServerClient();

    if (isNonEmptyString(body?.sourceUrl)) {
        try {
            const importer = createDbJobImporter({
                fetchPage: fetchJobPageAsDependency,
                extractJob: extractJobStub,
            });

            const job = await importer.importJobFromUrl(body.sourceUrl);

            return Response.json(job, { status: 201 });
        } catch (error: any) {
            if (error?.name === "FetchJobPageError") {
                return Response.json(
                    { error: "FAILED_TO_FETCH_JOB_PAGE" },
                    { status: 400 },
                );
            }

            if (error?.name === "InvalidExtractedJobDataError") {
                return Response.json(
                    { error: "INVALID_EXTRACTED_JOB_DATA" },
                    { status: 422 },
                );
            }

            throw error;
        }
    }

    if (isNonEmptyString(body?.sourceText)) {
        const repo = new DbJobRepository(db);

        const job = await repo.createJob({
            company: "Unknown",
            title: "Imported Job",
            sourceUrl: "",
            sourceText: body.sourceText,
            status: "saved",
        });

        return Response.json(job, { status: 201 });
    }

    return Response.json(
        { error: "INVALID_JOB_INPUT" },
        { status: 400 },
    );
}
