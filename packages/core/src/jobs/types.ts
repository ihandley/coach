export const JOB_STATUSES = [
  "saved",
  "researching",
  "applying",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
  "archived",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export type ApplicationEventType = "status_changed" | "note_added";

export type JobRecord = {
  id: string;
  company: string;
  title: string;
  sourceUrl: string;
  sourceText: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateJobInput = {
  company: string;
  title: string;
  sourceUrl: string;
  sourceText: string;
  status: JobStatus;
};

export type ApplicationEventRecord = {
  id: string;
  jobId: string;
  type: ApplicationEventType;
  note: string;
  createdAt: string;
};

export type AddApplicationEventInput = {
  jobId: string;
  type: ApplicationEventType;
  note: string;
};

export type UpdateJobStatusInput = {
  jobId: string;
  status: JobStatus;
  event?: {
    type: ApplicationEventType;
    note: string;
  };
};

export type ListJobsInput = {
  status?: JobStatus;
  company?: string;
  keyword?: string;
};

export type DashboardSummary = {
  totalTrackedJobs: number;
  countsByStatus: Record<JobStatus, number>;
  recentlyUpdatedJobs: JobRecord[];
};