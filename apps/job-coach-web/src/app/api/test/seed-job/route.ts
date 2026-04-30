import { createServerClient } from "@coach/db";
import { DbJobRepository } from "@coach/db";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }


  try {
  const repo = new DbJobRepository(createServerClient());

  const job = await repo.createJob({
    company: "Test Co",
    title: "Test Job",
    sourceUrl: "https://example.com/test-" + Date.now(),
    sourceText: "Test job description",
    status: "saved",
  });

      return Response.json(job);
  } catch (err) {
    console.error("SEED FAILED:", err);
    return Response.json({ error: "seed failed" }, { status: 500 });
  }
}
