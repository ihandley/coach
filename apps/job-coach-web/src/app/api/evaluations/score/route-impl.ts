type Server = {
    scoreJobFit(input: {
        jobId: string;
        resumeProfileId: string;
    }): Promise<unknown>;
};

export async function handleScoreEvaluation(
    request: Request,
    server: Server,
) {
    const body = await request.json();

    if (
        !body ||
        typeof body.jobId !== "string" ||
        typeof body.resumeProfileId !== "string"
    ) {
        return new Response(JSON.stringify({ error: "Invalid input" }), {
            status: 400,
            headers: {
                "content-type": "application/json",
            },
        });
    }

    const result = await server.scoreJobFit({
        jobId: body.jobId,
        resumeProfileId: body.resumeProfileId,
    });

    return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
            "content-type": "application/json",
        },
    });
}
