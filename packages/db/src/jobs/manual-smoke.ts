import { loadEnvFromKeychain } from "../env/load-env";
import { DbJobRepository } from "./db-job-repository";
import { createServerClient } from "../supabase/create-server-client";

async function main() {
  loadEnvFromKeychain();

  const repo = new DbJobRepository(createServerClient());

  const created = await repo.createJob({
    company: "Acme",
    title: "Backend Engineer",
    sourceUrl: "https://example.com/jobs/1",
    sourceText: "Example posting",
    status: "saved",
  });

  console.log("created", created);

  const found = await repo.getJobById(created.id);

  console.log("found", found);

  const jobs = await repo.listJobs();

  console.log("jobs", jobs);

  // add explicit event

  const event = await repo.addApplicationEvent({
    jobId: created.id,

    type: "note_added",

    note: "Reached out to recruiter",
  });

  console.log("event", event);

  // list events

  const events = await repo.listApplicationEvents(created.id);

  console.log("events", events);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
