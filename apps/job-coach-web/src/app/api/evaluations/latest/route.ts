import { evaluationsServer } from "../../../../server/evaluations/server";

type EvaluationServer = {
    getLatestEvaluation(input: {
        jobId: string;
        resumeProfileId: string;
    }): Promise<unknown | null>;
};

export async function handleGetLatestEvaluation(
    request: Request,
    server: EvaluationServer = evaluationsServer,
) {
    try {
        const url = new URL(request.url);
        const jobId = url.searchParams.get("jobId");
        const resumeProfileId = url.searchParams.get("resumeProfileId");

        if (
            typeof jobId !== "string" ||
            jobId.length === 0 ||
            typeof resumeProfileId !== "string" ||
            resumeProfileId.length === 0
        ) {
            return new Response(JSON.stringify({ error: "Invalid input" }), {
                status: 400,
            });
        }

        const result = await server.getLatestEvaluation({
            jobId,
            resumeProfileId,
        });

        if (!result) {
            return new Response(JSON.stringify({ error: "Not found" }), {
                status: 404,
            });
        }

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
                "content-type": "application/json",
            },
        });
    } catch {
        return new Response(JSON.stringify({ error: "Internal error" }), {
            status: 500,
        });
    }
}

export async function GET(request: Request) {
    return handleGetLatestEvaluation(request);
}
