import { createDbJobTracker } from "@coach/db";
import type { CreateJobInput } from "@coach/core";

export async function listJobs() {
  return createDbJobTracker().listJobs();
}

export async function getJobById(jobId: string) {
  return createDbJobTracker().getJobById(jobId);
}

export async function getDashboardSummary() {
  return createDbJobTracker().getDashboardSummary();
}

export async function createJob(input: CreateJobInput) {
  return createDbJobTracker().createJob(input);
}