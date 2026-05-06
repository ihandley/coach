import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { writeDataBackup } from "./data-backup";

const tempDirs: string[] = [];

function createTempDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "job-coach-backup-"));
  tempDirs.push(dir);
  return dir;
}

function createClient() {
  return {
    from(table: string) {
      return {
        async select(columns: string) {
          if (columns !== "*") {
            throw new Error("Unexpected select columns");
          }

          if (table === "jobs") {
            return {
              data: [{ id: "job-1", title: "Staff Engineer" }],
              error: null,
            };
          }

          if (table === "resume_profiles") {
            return {
              data: [{ id: "resume-1", name: "Default Resume" }],
              error: null,
            };
          }

          throw new Error(`Unexpected table: ${table}`);
        },
      };
    },
  };
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("writeDataBackup", () => {
  it("writes a timestamped backup in production", async () => {
    const backupDir = createTempDir();
    const result = await writeDataBackup({
      backupDir,
      client: createClient() as never,
      env: {
        APP_ENV: "production",
      },
      now: new Date("2026-05-05T12:34:56.000Z"),
      reason: "job-import",
    });

    expect(result.status).toBe("written");
    if (result.status !== "written") {
      throw new Error("Expected backup to be written");
    }

    expect(result.file).toBe(
      path.join(backupDir, "job-coach-job-import-2026-05-05T12-34-56Z.json"),
    );

    const backup = JSON.parse(fs.readFileSync(result.file, "utf8"));

    expect(backup).toEqual({
      jobs: [{ id: "job-1", title: "Staff Engineer" }],
      resumes: [{ id: "resume-1", name: "Default Resume" }],
      exportedAt: "2026-05-05T12:34:56.000Z",
      reason: "job-import",
    });
  });

  it("does not write backups in development by default", async () => {
    const backupDir = createTempDir();
    const result = await writeDataBackup({
      backupDir,
      client: createClient() as never,
      env: {
        APP_ENV: "development",
      },
      now: new Date("2026-05-05T12:34:56.000Z"),
      reason: "job-import",
    });

    expect(result).toEqual({
      status: "skipped",
      reason: "development-not-allowed",
    });
    expect(fs.readdirSync(backupDir)).toEqual([]);
  });

  it("writes development backups only with the explicit allow flag", async () => {
    const backupDir = createTempDir();
    const result = await writeDataBackup({
      backupDir,
      client: createClient() as never,
      env: {
        APP_ENV: "development",
        JOB_COACH_ALLOW_DEV_BACKUP: "1",
      },
      now: new Date("2026-05-05T12:34:56.000Z"),
      reason: "manual-export",
    });

    expect(result.status).toBe("written");
    if (result.status !== "written") {
      throw new Error("Expected backup to be written");
    }

    expect(result.file).toBe(
      path.join(backupDir, "job-coach-manual-export-2026-05-05T12-34-56Z.json"),
    );
  });
});
