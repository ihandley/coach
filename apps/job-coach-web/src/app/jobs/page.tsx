import { getJobs } from "@/lib/jobs";
import { JobsPageClient } from "./jobs-page-client";

export default async function JobsPage() {
  const jobs = await getJobs();

  return <JobsPageClient jobs={jobs} />;
}
