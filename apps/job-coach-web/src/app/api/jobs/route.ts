import { createDbJobImporter } from "@coach/db";
import { DbJobRepository } from "@coach/db";

function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

export async function GET() {
    const { listJobs } = new DbJobRepository({} as never);
    const jobs = await listJobs();

    return Response.json(jobs);
}

export async function POST(request: Request) {
    const body = await request.json();

    // URL ingestion path
    if (isNonEmptyString(body?.sourceUrl)) {
        const importer = createDbJobImporter({} as never);

        try {
            const job = await importer.importJobFromUrl(body.sourceUrl);
            return Response.json(job, { status: 201 });
        } catch (error) {
            return Response.json(
                { error: "JOB_IMPORT_FAILED" },
                { status: 500 },
            );
        }
    }

    // Raw text fallback
    if (isNonEmptyString(body?.sourceText)) {
        const repo = new DbJobRepository({} as never);

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
