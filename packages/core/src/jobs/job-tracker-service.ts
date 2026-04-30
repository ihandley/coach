import type {
  AddApplicationEventInput,
  ApplicationEventRecord,
  CreateJobInput,
  DashboardSummary,
  JobRecord,
  ListJobsInput,
  UpdateJobStatusInput,
} from "./types.ts";

export interface JobTrackerService {
  createJob(input: CreateJobInput): Promise<JobRecord>;
  getJobById(jobId: string): Promise<JobRecord>;
  listJobs(input?: ListJobsInput): Promise<JobRecord[]>;
  updateJobStatus(input: UpdateJobStatusInput): Promise<JobRecord>;
  addApplicationEvent(input: AddApplicationEventInput): Promise<ApplicationEventRecord>;
  listApplicationEvents(jobId: string): Promise<ApplicationEventRecord[]>;
  getDashboardSummary(): Promise<DashboardSummary>;
}