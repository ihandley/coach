import { calculateFit } from "../../../server/match/calculate-fit";
import { getDb } from "../../../server/db/client";

export async function POST(request: Request) {
    const body = await request.json();
    const db = getDb();

    if (!body?.jobId || !body?.resumeProfileId) {
        return Response.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    const job = {
        title: "Unknown",
        company: "Unknown",
        sourceText: "",
    };

    const resume = {
        rawText: body.resumeProfileId,
    };

    const result = calculateFit(job, resume);

    return Response.json(result);
}
