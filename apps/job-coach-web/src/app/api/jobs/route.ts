import { cleanJobText, extractJobFields } from "@coach/core";
import type { ExtractedJobData, FetchedJobPage } from "@coach/core";
import { createDbJobImporter, DbJobRepository, createServerClient } from "@coach/db";
import { generateStructuredSummary } from "@/server/ai/structured-job-summary";
import { fetchJobPageAsDependency, extractJobStub } from "@coach/ai";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function generateStoredStructuredSummary(sourceText: string) {
  try {
    return await generateStructuredSummary(sourceText);
  } catch (error) {
    console.error("AI summary failed", error);
    return null;
  }
}

async function extractJobWithStructuredSummary(input: FetchedJobPage): Promise<ExtractedJobData> {
  const extracted = await extractJobStub(input);
  const rawDescription = cleanJobText(extracted.rawDescription);
  const structuredSummary = await generateStoredStructuredSummary(rawDescription);

  return {
    ...extracted,
    rawDescription,
    structuredSummary,
  };
}

export async function GET() {
  const db = createServerClient();
  const repo = new DbJobRepository(db);

  const jobs = await repo.listJobs();

  return Response.json(jobs);
}

export async function POST(request: Request) {
  const body = await request.json();
  const db = createServerClient();

  if (isNonEmptyString(body?.sourceUrl)) {
    try {
      const importer = createDbJobImporter({
        fetchPage: fetchJobPageAsDependency,
        extractJob: extractJobWithStructuredSummary,
      });

      const job = await importer.importJobFromUrl(body.sourceUrl);

      return Response.json(job, { status: 201 });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "FetchJobPageError") {
        return Response.json({ error: "FAILED_TO_FETCH_JOB_PAGE" }, { status: 400 });
      }

      if (error instanceof Error && error.name === "InvalidExtractedJobDataError") {
        return Response.json({ error: "INVALID_EXTRACTED_JOB_DATA" }, { status: 422 });
      }

      throw error;
    }
  }

  if (isNonEmptyString(body?.sourceText)) {
    const repo = new DbJobRepository(db);
    const sourceText = cleanJobText(body.sourceText);
    const fields = extractJobFields(sourceText);
    const structuredSummary = await generateStoredStructuredSummary(sourceText);

    const job = await repo.createJob({
      company: fields.company,
      title: fields.title,
      sourceUrl: isNonEmptyString(body.sourceUrl) ? body.sourceUrl : "",
      sourceText,
      structuredSummary,
      status: "saved",
    });

    return Response.json(job, { status: 201 });
  }

  return Response.json({ error: "INVALID_JOB_INPUT" }, { status: 400 });
}
