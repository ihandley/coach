import { writeDataBackup } from "../apps/job-coach-web/src/server/data-backup";

async function run() {
  console.log("Exporting data...");

  const result = await writeDataBackup({
    reason: "manual-export",
  });

  if (result.status === "skipped") {
    console.log(
      "Export skipped: APP_ENV is not production. Set JOB_COACH_ALLOW_DEV_BACKUP=1 to export DEV.",
    );
    return;
  }

  console.log("Export complete:", result.file);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
