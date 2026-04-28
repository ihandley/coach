export type JobListItem = {
  id: string;
  company: string;
  title: string;
  status: string;
  sourceUrl?: string | null;
  createdAt?: string;
  updatedAt: string;
  score?: number;
};

export function formatJobDate(date: string) {
  return date.slice(0, 10);
}

export function sortJobsByCreatedDate(jobs: JobListItem[]) {
  return [...jobs].sort((first, second) =>
    (second.createdAt ?? "").localeCompare(first.createdAt ?? ""),
  );
}

export function isRecentlyCreated(date: string, now = new Date()) {
  const created = new Date(date);
  const ageMs = now.getTime() - created.getTime();

  return ageMs >= 0 && ageMs < 24 * 60 * 60 * 1000;
}

export const formatJobUpdatedDate = formatJobDate;

export function sortJobsByUpdatedDate(jobs: JobListItem[]) {
  return [...jobs].sort((first, second) =>
    second.updatedAt.localeCompare(first.updatedAt),
  );
}
