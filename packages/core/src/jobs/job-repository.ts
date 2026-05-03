import type {
  AddApplicationEventInput,
  ApplicationEventRecord,
  CreateJobInput,
  JobRecord,
  ListJobsInput,
  UpdateJobStatusInput,
} from "./types";

export interface JobRepository {
  createJob(input: CreateJobInput): Promise<JobRecord>;
  getJobById(jobId: string): Promise<JobRecord | null>;
  listJobs(input?: ListJobsInput): Promise<JobRecord[]>;
  updateJobStatus(input: UpdateJobStatusInput): Promise<JobRecord>;
  addApplicationEvent(input: AddApplicationEventInput): Promise<ApplicationEventRecord>;
  listApplicationEvents(jobId: string): Promise<ApplicationEventRecord[]>;
  findJobBySourceUrl(sourceUrl: string): Promise<JobRecord | null>;
}
