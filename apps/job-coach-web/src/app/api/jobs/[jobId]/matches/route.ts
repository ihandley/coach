import { getDb } from "../../../../../server/db/client";

export async function GET(_: Request, context: { params: Promise<{ jobId: string }> }) {
  const db = getDb();

  const { jobId } = await context.params;

  const matches = (db.jobRepo as any).getMatchResults?.(jobId) ?? [];

  return Response.json(matches);
}
