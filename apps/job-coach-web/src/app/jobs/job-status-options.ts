import type { JobStatus } from "@coach/core/jobs";

export const JOB_STATUS_OPTIONS = [
  "saved",
  "researching",
  "applying",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
  "archived",
] as const satisfies readonly JobStatus[];

export type JobStatusOption = (typeof JOB_STATUS_OPTIONS)[number];

const JOB_STATUS_SET = new Set<string>(JOB_STATUS_OPTIONS);

const STATUS_LABELS: Record<JobStatusOption, string> = {
  saved: "Saved",
  researching: "Researching",
  applying: "Applying",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  archived: "Archived",
};

const STATUS_CHIP_CLASS_NAMES: Record<JobStatusOption, string> = {
  saved: "border-gray-500 bg-gray-100 text-gray-700",
  researching: "border-gray-500 bg-gray-100 text-gray-700",
  applying: "border-blue-500 bg-blue-100 text-blue-700",
  applied: "border-blue-500 bg-blue-100 text-blue-700",
  interviewing: "border-purple-500 bg-purple-100 text-purple-700",
  offer: "border-green-500 bg-green-100 text-green-700",
  rejected: "border-red-500 bg-red-100 text-red-700",
  withdrawn: "border-gray-500 bg-gray-100 text-gray-700",
  archived: "border-gray-500 bg-gray-100 text-gray-700",
};

const STATUS_BADGE_CLASS_NAMES: Record<JobStatusOption, string> = {
  saved: "bg-gray-100 text-gray-800",
  researching: "bg-gray-100 text-gray-800",
  applying: "bg-blue-100 text-blue-800",
  applied: "bg-blue-100 text-blue-800",
  interviewing: "bg-yellow-100 text-yellow-800",
  offer: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-gray-100 text-gray-800",
  archived: "bg-gray-200 text-gray-600",
};

export function createVisibleJobStatuses() {
  return new Set<JobStatusOption>(JOB_STATUS_OPTIONS);
}

export function normalizeJobStatus(status: string | null | undefined): JobStatusOption | null {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();

  return JOB_STATUS_SET.has(normalized) ? (normalized as JobStatusOption) : null;
}

export function countJobsByStatus(jobs: Array<{ status?: string | null }>) {
  const counts = Object.fromEntries(JOB_STATUS_OPTIONS.map((status) => [status, 0])) as Record<
    JobStatusOption,
    number
  >;

  for (const job of jobs) {
    const status = normalizeJobStatus(job.status);

    if (status) {
      counts[status] += 1;
    }
  }

  return counts;
}

export function areAllJobStatusesVisible(visibleStatuses: ReadonlySet<JobStatusOption>) {
  return JOB_STATUS_OPTIONS.every((status) => visibleStatuses.has(status));
}

export function getJobStatusLabel(status: JobStatusOption) {
  return STATUS_LABELS[status];
}

export function getActiveStatusChipClassName(status: JobStatusOption) {
  return STATUS_CHIP_CLASS_NAMES[status];
}

export function getJobStatusBadgeClassName(status: string) {
  const normalized = normalizeJobStatus(status);

  return normalized ? STATUS_BADGE_CLASS_NAMES[normalized] : "bg-gray-100 text-gray-800";
}
