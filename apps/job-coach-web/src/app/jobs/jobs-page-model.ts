export type JobListItem = {
    id: string;
    company: string;
    title: string;
    status: string;
    updatedAt: string;
};

export function formatJobUpdatedDate(date: string) {
    return date.slice(0, 10);
}

export function sortJobsByUpdatedDate(jobs: JobListItem[]) {
    return [...jobs].sort((first, second) =>
        second.updatedAt.localeCompare(first.updatedAt),
    );
}
