function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}

function isWorkflowType(
    value: unknown,
): value is "import-job-and-score-fit" | "generate-application-materials" {
    return (
        value === "import-job-and-score-fit" ||
        value === "generate-application-materials"
    );
}

function isFormat(value: unknown): value is "pdf" | "docx" {
    return value === "pdf" || value === "docx";
}

export async function GET() {
    const { workflowsServer } = await import("../../../server/workflows-server");
    const runs = await workflowsServer.listWorkflowRuns();

    return Response.json(runs, { status: 200 });
}

export async function POST(request: Request) {
    const body = await request.json();

    if (!body || !isWorkflowType(body.workflowType)) {
        return Response.json({ error: "INVALID_WORKFLOW_INPUT" }, { status: 400 });
    }

    const { workflowsServer } = await import("../../../server/workflows-server");

    try {
        if (body.workflowType === "import-job-and-score-fit") {
            if (
                !isNonEmptyString(body.sourceUrl) ||
                !isNonEmptyString(body.resumeProfileId)
            ) {
                return Response.json(
                    { error: "INVALID_WORKFLOW_INPUT" },
                    { status: 400 },
                );
            }

            const result =
                await workflowsServer.startImportJobAndScoreFitWorkflow({
                    sourceUrl: body.sourceUrl,
                    resumeProfileId: body.resumeProfileId,
                });

            return Response.json(result, { status: 201 });
        }

        if (
            !isNonEmptyString(body.resumeProfileId) ||
            !isNonEmptyString(body.resumeVersionId) ||
            !isNonEmptyString(body.jobId) ||
            (body.format !== undefined && !isFormat(body.format))
        ) {
            return Response.json({ error: "INVALID_WORKFLOW_INPUT" }, { status: 400 });
        }

        const result =
            await workflowsServer.startGenerateApplicationMaterialsWorkflow({
                resumeProfileId: body.resumeProfileId,
                resumeVersionId: body.resumeVersionId,
                jobId: body.jobId,
                format: body.format,
            });

        return Response.json(result, { status: 201 });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "WORKFLOW_EXECUTION_FAILED";

        return Response.json(
            {
                error: message,
            },
            { status: 500 },
        );
    }
}
