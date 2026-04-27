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
    try {
        const body = await request.json();
        const db = createServerClient();

        if (isNonEmptyString(body?.sourceUrl)) {
            const repo = new DbJobRepository(db);

            const existing = await repo.findJobBySourceUrl(body.sourceUrl);

            if (existing) {
                return Response.json(existing, { status: 200 });
            }

            const importer = createDbJobImporter({
                fetchPage: fetchJobPageAsDependency,
                extractJob: extractJobStub,
            });

            try {
                const job = await importer.importJobFromUrl(body.sourceUrl);
                return Response.json(job, { status: 201 });
            } catch (err: any) {
                console.error("IMPORT ERROR:", err);

                return Response.json(
                    {
                        error: "IMPORT_FAILED",
                        message: err?.message || "Unknown import error",
                    },
                    { status: 500 }
                );
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
    } catch (err: any) {
        console.error("REQUEST ERROR:", err);

        return Response.json(
            {
                error: "REQUEST_FAILED",
                message: err?.message || "Unknown request error",
            },
            { status: 500 }
        );
    }
}


export async function DELETE(request: Request) {
    const body = await request.json();

    if (!body?.id) {
        return Response.json({ error: "MISSING_ID" }, { status: 400 });
    }

    const db = createServerClient();

    const { error } = await db
        .from("jobs")
        .delete()
        .eq("id", body.id);

    if (error) {
        return Response.json({ error: "DELETE_FAILED" }, { status: 500 });
    }

    return Response.json({ success: true });
}
