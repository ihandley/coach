import { createServerClient, DbJobRepository } from "@coach/db";

const jobRepository = new DbJobRepository(createServerClient());

export async function getJobs() {
  return jobRepository.listJobs();
}
