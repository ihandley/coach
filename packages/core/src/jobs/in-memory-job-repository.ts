import type { JobRepository } from "./job-repository";
import type {
  AddApplicationEventInput,
  ApplicationEventRecord,
  CreateJobInput,
  JobRecord,
  JobStatus,
  ListJobsInput,
  UpdateJobStatusInput,
} from "./types";
import { JOB_STATUSES } from "./types";

import { InvalidJobStatusError, JobNotFoundError } from "./job-tracker";

function isJobStatus(value: string): value is JobStatus {
  return JOB_STATUSES.includes(value as JobStatus);
}

function createId(): string {
  return crypto.randomUUID();
}

function nextTimestamp(previous?: string): string {
  const now = Date.now();
  const previousMs = previous ? Date.parse(previous) : Number.NaN;
  const safeMs = Number.isNaN(previousMs) || now > previousMs ? now : previousMs + 1;

  return new Date(safeMs).toISOString();
}

export class InMemoryJobRepository implements JobRepository {
  private jobs = new Map<string, JobRecord>();
  private events: ApplicationEventRecord[] = [];

  async createJob(input: CreateJobInput): Promise<JobRecord> {
    if (!isJobStatus(input.status)) {
      throw new InvalidJobStatusError(input.status);
    }

    const now = nextTimestamp();

    const job: JobRecord = {
      id: createId(),
      company: input.company,
      title: input.title,
      sourceUrl: input.sourceUrl,
      sourceText: input.sourceText,
      structuredSummary: input.structuredSummary,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    };

    this.jobs.set(job.id, job);

    return job;
  }

  async getJobById(jobId: string): Promise<JobRecord | null> {
    return this.jobs.get(jobId) ?? null;
  }

  async findJobBySourceUrl(sourceUrl: string): Promise<JobRecord | null> {
    for (const job of this.jobs.values()) {
      if (job.sourceUrl === sourceUrl) {
        return job;
      }
    }

    return null;
  }

  async listJobs(input?: ListJobsInput): Promise<JobRecord[]> {
    let jobs = Array.from(this.jobs.values());

    if (input?.status) {
      jobs = jobs.filter((job) => job.status === input.status);
    }

    if (input?.company) {
      const companyQuery = input.company.toLowerCase();
      jobs = jobs.filter((job) => job.company.toLowerCase().includes(companyQuery));
    }

    if (input?.keyword) {
      const keyword = input.keyword.toLowerCase();
      jobs = jobs.filter(
        (job) =>
          job.company.toLowerCase().includes(keyword) || job.title.toLowerCase().includes(keyword),
      );
    }

    return jobs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async updateJobStatus(input: UpdateJobStatusInput): Promise<JobRecord> {
    if (!isJobStatus(input.status)) {
      throw new InvalidJobStatusError(input.status);
    }

    const existingJob = this.jobs.get(input.jobId);

    if (!existingJob) {
      throw new JobNotFoundError(input.jobId);
    }

    const updatedJob: JobRecord = {
      ...existingJob,
      status: input.status,
      updatedAt: nextTimestamp(existingJob.updatedAt),
    };

    this.jobs.set(updatedJob.id, updatedJob);

    if (input.event) {
      this.events.push({
        id: createId(),
        jobId: updatedJob.id,
        type: input.event.type,
        note: input.event.note,
        createdAt: nextTimestamp(updatedJob.updatedAt),
      });
    }

    return updatedJob;
  }

  async deleteJob(jobId: string): Promise<void> {
    this.jobs.delete(jobId);
    this.events = this.events.filter((event) => event.jobId !== jobId);
  }

  async addApplicationEvent(input: AddApplicationEventInput): Promise<ApplicationEventRecord> {
    const existingJob = this.jobs.get(input.jobId);

    if (!existingJob) {
      throw new JobNotFoundError(input.jobId);
    }

    const event: ApplicationEventRecord = {
      id: createId(),
      jobId: input.jobId,
      type: input.type,
      note: input.note,
      createdAt: nextTimestamp(existingJob.updatedAt),
    };

    this.events.push(event);

    const updatedJob: JobRecord = {
      ...existingJob,
      updatedAt: nextTimestamp(event.createdAt),
    };

    this.jobs.set(updatedJob.id, updatedJob);

    return event;
  }

  async listApplicationEvents(jobId: string): Promise<ApplicationEventRecord[]> {
    return this.events.filter((event) => event.jobId === jobId);
  }
}
