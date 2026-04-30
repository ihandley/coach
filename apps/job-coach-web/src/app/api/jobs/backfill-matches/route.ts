import { createServerClient } from "@coach/db";
import { backfillJobMatches } from "@/server/match/backfill-job-matches";

export async function POST() {
  let db;

  try {
    db = createServerClient();
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Missing SUPABASE_URL" ||
        error.message === "Missing SUPABASE_SERVICE_ROLE_KEY")
    ) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    throw error;
  }

  const result = await backfillJobMatches(db);

  return Response.json(result);
}
