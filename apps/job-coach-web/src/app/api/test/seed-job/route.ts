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
      title: "Test Job (HAS DESCRIPTION)",
      sourceUrl: "https://example.com/test-" + Date.now(),
      sourceText: `hey 👋 thanks for checking this out

ABOUT THE COMPANY / POSITION:
small messy startup hiring a backend engineer.

REQUIREMENTS-ish:
- TypeScript
- Postgres
- production systems

LOCATION:
Remote US only.

SALARY / COMP:
$140k - $185k + equity

BENEFITS:
health, dental, vision, PTO, laptop

EASTER EGG / APPLICATION INSTRUCTIONS:
To show you read this, include the phrase "purple squirrel" in your application.`,
      status: "saved",
    });

    return Response.json(job);
  } catch (err) {
    console.error("SEED FAILED:", err);
    return Response.json({ error: "seed failed" }, { status: 500 });
  }
}
