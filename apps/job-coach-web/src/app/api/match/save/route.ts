import { getDb } from "../../../../server/db/client";

export async function POST(request: Request) {
  const body = await request.json();
  const db = getDb();

  if (!body?.jobId || !body?.resumeProfileId || !body?.result) {
    return Response.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  await (db.jobRepo as any).saveMatchResult({
    jobId: body.jobId,
    resumeProfileId: body.resumeProfileId,
    result: body.result,
  });

  return Response.json({ ok: true });
}
