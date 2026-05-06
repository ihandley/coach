import fs from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type BackupClient = Pick<SupabaseClient, "from">;
type BackupEnv = Record<string, string | undefined>;

export type BackupReason = "manual-export" | "job-import";

export type BackupData = {
  jobs: unknown[];
  resumes: unknown[];
  exportedAt: string;
  reason: BackupReason;
};

export type BackupResult =
  | {
      status: "written";
      file: string;
      data: BackupData;
    }
  | {
      status: "skipped";
      reason: "development-not-allowed";
    };

type BackupOptions = {
  client?: BackupClient;
  backupDir?: string;
  env?: BackupEnv;
  now?: Date;
  reason: BackupReason;
};

const DEFAULT_BACKUP_DIR = "backups";
const DEV_BACKUP_ALLOW_FLAG = "JOB_COACH_ALLOW_DEV_BACKUP";

function isDevelopmentBackupAllowed(env: BackupEnv) {
  return env[DEV_BACKUP_ALLOW_FLAG] === "1";
}

function shouldWriteBackup(env: BackupEnv) {
  return env.APP_ENV === "production" || isDevelopmentBackupAllowed(env);
}

function createBackupClient(env: BackupEnv) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to export data.");
  }

  return createClient(url, key);
}

function formatTimestamp(date: Date) {
  return date
    .toISOString()
    .replaceAll(":", "-")
    .replace(/\.\d{3}Z$/, "Z");
}

async function selectAll(client: BackupClient, table: string) {
  const result = await client.from(table).select("*");

  if (result.error) {
    throw new Error(`Failed to export ${table}: ${result.error.message}`);
  }

  return result.data ?? [];
}

export async function writeDataBackup({
  client,
  backupDir = DEFAULT_BACKUP_DIR,
  env = process.env,
  now = new Date(),
  reason,
}: BackupOptions): Promise<BackupResult> {
  if (!shouldWriteBackup(env)) {
    return {
      status: "skipped",
      reason: "development-not-allowed",
    };
  }

  const backupClient = client ?? createBackupClient(env);
  const [jobs, resumes] = await Promise.all([
    selectAll(backupClient, "jobs"),
    selectAll(backupClient, "resume_profiles"),
  ]);
  const exportedAt = now.toISOString();
  const data: BackupData = {
    jobs,
    resumes,
    exportedAt,
    reason,
  };
  const timestamp = formatTimestamp(now);
  const file = path.join(backupDir, `job-coach-${reason}-${timestamp}.json`);

  fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));

  return {
    status: "written",
    file,
    data,
  };
}

export async function writeAutomatedImportBackup(client: BackupClient) {
  const result = await writeDataBackup({
    client,
    reason: "job-import",
  });

  if (result.status === "written") {
    console.log("Job Coach backup written before job import:", result.file);
    return;
  }

  console.log("Job Coach backup skipped before job import: APP_ENV is not production.");
}
