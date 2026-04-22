import { evaluationsServer } from "../../../../server/evaluations/server";

type Deps = {
    server?: {
        scoreJobFit(input: {
            jobId: string;
            resumeProfileId: string;
        }): Promise<unknown>;
    };
};

export async function POST(request: Request, deps?: Deps) {
    try {
        const body = await request.json();
        const { jobId, resumeProfileId } = body ?? {};

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

        const server = deps?.server ?? evaluationsServer;

        const result = await server.scoreJobFit({
            jobId,
            resumeProfileId,
        });

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