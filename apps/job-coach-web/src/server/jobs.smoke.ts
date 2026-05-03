import { listJobs, getDashboardSummary } from "./jobs";

async function main() {
  const jobs = await listJobs();
  console.log("jobs", jobs);

  const summary = await getDashboardSummary();
  console.log("summary", summary);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
