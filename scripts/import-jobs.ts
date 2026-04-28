import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const LEGACY_ID_NAMESPACE = "f2a6f0b3-5f8c-4b3e-9b5f-1a0c0d3e4f50";

function uuidFromLegacyId(legacyId: string) {
  const hash = crypto
    .createHash("sha1")
    .update(`${LEGACY_ID_NAMESPACE}:${legacyId}`)
    .digest("hex");

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `5${hash.slice(13, 16)}`,
    `8${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join("-");
}

function normalizedCreatedAt(job: any): string {
  const value =
    job.applied_date ||
    job.saved_date ||
    job.createdAt ||
    job.created_at;

  return value && String(value).trim().length > 0
    ? new Date(value).toISOString()
    : new Date().toISOString();
}

function mapStatus(status: unknown) {
  if (typeof status !== "string" || status.trim() === "") return "saved";

  const normalized = status.trim().toLowerCase();

  if (["saved", "applied", "rejected", "interviewing"].includes(normalized)) {
    return normalized;
  }

  if (["under_review", "awaiting_opportunity"].includes(normalized)) {
    return "applied";
  }

  if (["skipped", "not_interested"].includes(normalized)) {
    return "rejected";
  }

  return "saved";
}

async function main() {
  const filePath = path.resolve(
    process.env.HOME!,
    "code/github/opencode/data/job-coach/jobs.json",
  );

  const raw = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(raw);
  const jobs = json.jobs ?? [];

  console.log(`Importing ${jobs.length} jobs...`);

  let imported = 0;
  let failed = 0;

  for (const job of jobs) {
    const legacyId = String(job.id ?? `${job.company}-${job.title}-${job.url ?? ""}`);
    const id = uuidFromLegacyId(legacyId);

    const { error } = await supabase.from("jobs").upsert({
      id,
      company: job.company ?? "Unknown",
      title: job.title ?? "Unknown",
      source_url: job.url ?? "",
      source_text: job.description ?? job.rawDescription ?? job.notes ?? "",
      status: mapStatus(job.status),
      created_at: normalizedCreatedAt(job),
    });

    if (error) {
      failed++;
      console.error("Failed:", legacyId, error.message);
    } else {
      imported++;
      console.log("Imported:", job.company, "-", job.title);
    }
  }

  console.log(`Done. Imported ${imported}. Failed ${failed}.`);
}

main();
