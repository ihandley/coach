import type { CreateJobInput } from "@coach/core";
import { createDbJobImporter, createDbJobTracker } from "@coach/db";

type FetchPage = (url: string) => Promise<{
  url: string;
  html: string;
}>;

type ExtractJob = (input: { url: string; html: string }) => Promise<{
  company: string;
  title: string;
  rawDescription: string;
} & Record<string, unknown>>;

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
  dependencies: {
    fetchPage: FetchPage;
    extractJob: ExtractJob;
  },
) {
  return createDbJobImporter({
    fetchPage: dependencies.fetchPage,
    extractJob: dependencies.extractJob,
  }).importJobFromUrl(url);
}