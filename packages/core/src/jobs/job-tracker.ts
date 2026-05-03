import type { JobRepository } from "./job-repository";
import type { JobTrackerService } from "./job-tracker-service";
import type {
  AddApplicationEventInput,
  ApplicationEventRecord,
  DashboardSummary,
  JobRecord,
  UpdateJobStatusInput,
  CreateJobInput,
  ListJobsInput,
} from "./types";
import { JOB_STATUSES } from "./types";

export class InvalidJobStatusError extends Error {
  constructor(status: string) {
    super(`Invalid job status: ${status}`);
    this.name = "InvalidJobStatusError";
  }
}

export class JobNotFoundError extends Error {
  constructor(jobId: string) {
    super(`Job not found: ${jobId}`);
    this.name = "JobNotFoundError";
  }
}

function createEmptyCountsByStatus() {
  return {
    saved: 0,
    researching: 0,
    applying: 0,
    applied: 0,
    interviewing: 0,
    offer: 0,
    rejected: 0,
    withdrawn: 0,
    archived: 0,
  };
}

export class JobTracker implements JobTrackerService {
  constructor(private readonly repository: JobRepository) {}

  async createJob(input: CreateJobInput): Promise<JobRecord> {
    return this.repository.createJob(input);
  }

  async getJobById(jobId: string): Promise<JobRecord> {
    const job = await this.repository.getJobById(jobId);

    if (!job) {
      throw new JobNotFoundError(jobId);
    }

    return job;
  }

  async listJobs(input?: ListJobsInput): Promise<JobRecord[]> {
    return this.repository.listJobs(input);
  }

  async updateJobStatus(input: UpdateJobStatusInput): Promise<JobRecord> {
    return this.repository.updateJobStatus(input);
  }

  async addApplicationEvent(input: AddApplicationEventInput): Promise<ApplicationEventRecord> {
    return this.repository.addApplicationEvent(input);
  }

  async listApplicationEvents(jobId: string): Promise<ApplicationEventRecord[]> {
    return this.repository.listApplicationEvents(jobId);
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const jobs = await this.repository.listJobs();
    const countsByStatus = createEmptyCountsByStatus();

    for (const job of jobs) {
      countsByStatus[job.status] += 1;
    }

    const recentlyUpdatedJobs = [...jobs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return {
      totalTrackedJobs: jobs.length,
      countsByStatus,
      recentlyUpdatedJobs,
    };
  }
}
