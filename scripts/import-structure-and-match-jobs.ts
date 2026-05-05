import { cleanJobText } from "@coach/core";
import { fetchJobPageAsDependency } from "../packages/ai/src/jobs/fetch-job-page";
import { extractJobStub } from "../packages/ai/src/jobs/extract-job-stub";
import { createClient } from "@supabase/supabase-js";
import { generateStructuredSummary } from "../apps/job-coach-web/src/server/ai/structured-job-summary";

const appUrl = process.env.JOB_COACH_APP_URL ?? "http://localhost:3001";
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resumeProfileId = process.env.RESUME_PROFILE_ID ?? "default";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const db = createClient(supabaseUrl, serviceRoleKey);

function isRealUrl(value: string | null | undefined) {
  return Boolean(value && /^https?:\/\//i.test(value));
}

async function postJson(path: string, body: unknown) {
  const response = await fetch(`${appUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}: ${await response.text()}`);
  }

  return response.json();
}

async function refreshJobFromUrl(job: any) {
  const fetched = await fetchJobPageAsDependency(job.source_url);
  const extracted = await extractJobStub(fetched);
  const sourceText = cleanJobText(extracted.rawDescription);
  const structuredSummary = await generateStructuredSummary(sourceText);

  const { error } = await db
    .from("jobs")
    .update({
      company: extracted.company || job.company,
      title: extracted.title || job.title,
      source_text: sourceText,
      structured_summary: structuredSummary,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  if (error) throw error;
}

async function refreshStructuredSummaryFromExistingText(job: any) {
  if (!job.source_text) return false;

  const sourceText = cleanJobText(job.source_text);
  const structuredSummary = await generateStructuredSummary(sourceText);

  const { error } = await db
    .from("jobs")
    .update({
      source_text: sourceText,
      structured_summary: structuredSummary,
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  if (error) throw error;
  return true;
}

async function main() {
  const { data: jobs, error } = await db
    .from("jobs")
    .select("id, company, title, source_url, source_text, structured_summary")
    .order("created_at", { ascending: true });

  if (error) throw error;

  let refreshedFromUrl = 0;
  let refreshedFromExistingText = 0;
  let matched = 0;
  let skippedNoContent = 0;
  let failed = 0;

  for (const job of jobs ?? []) {
    const label = `${job.company} — ${job.title}`;

    try {
      if (isRealUrl(job.source_url)) {
        await refreshJobFromUrl(job);
        refreshedFromUrl++;
        console.log(`REFRESH url/raw/structured ok: ${label}`);
      } else if (await refreshStructuredSummaryFromExistingText(job)) {
        refreshedFromExistingText++;
        console.log(`REFRESH raw/structured from existing text ok: ${label}`);
      } else {
        skippedNoContent++;
        console.log(`SKIP no URL or source text: ${label}`);
      }

      await postJson("/api/match", {
        jobId: job.id,
        resumeProfileId,
      });

      matched++;
      console.log(`MATCH ok: ${label}`);
    } catch (err) {
      failed++;
      console.error(`FAIL: ${label}`);
      console.error(err instanceof Error ? err.message : err);
    }
  }

  console.log("");
  console.log("Done.");
  console.log(`Refreshed from URL: ${refreshedFromUrl}`);
  console.log(`Refreshed from existing text: ${refreshedFromExistingText}`);
  console.log(`Matched: ${matched}`);
  console.log(`Skipped no content: ${skippedNoContent}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
