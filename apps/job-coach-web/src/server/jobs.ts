import type { CreateJobInput, ExtractJob, FetchPage } from "@coach/core";
import { fetchJobPageAsDependency, extractJobStub } from "@coach/ai";
import { createDbJobImporter, createDbJobTracker } from "@coach/db";

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

export async function importJobFromUrl(
  url: string,
  dependencies?: {
    fetchPage?: FetchPage;
    extractJob?: ExtractJob;
  },
) {
  return createDbJobImporter({
    fetchPage: dependencies?.fetchPage ?? fetchJobPageAsDependency,
    extractJob: dependencies?.extractJob ?? extractJobStub,
  }).importJobFromUrl(url);
}