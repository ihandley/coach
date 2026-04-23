import { workflowsServer } from "../../../../server/workflows-server";

export async function GET(
    _request: Request,
    context: { params: Promise<{ workflowRunId: string }> },
) {
    const { workflowRunId } = await context.params;

    const result = await workflowsServer.getWorkflowRun({
        workflowRunId,
    });

    if (!result) {
        return Response.json({ error: "WORKFLOW_RUN_NOT_FOUND" }, { status: 404 });
    }

    return Response.json(result, { status: 200 });
}