"use client";

import { useEffect, useState } from "react";

type JobListItem = {
    id: string;
    company: string;
    title: string;
    status: string;
    updatedAt: string;
};

function formatDate(date: string) {
    return date.slice(0, 10);
}

async function defaultGetJobs(): Promise<JobListItem[]> {
    const res = await fetch("/api/jobs");
    if (!res.ok) return [];
    return res.json();
}

function sortJobsByUpdatedAt(jobs: JobListItem[]) {
    return [...jobs].sort(
        (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
}

export default function JobsPage({
    getJobs = defaultGetJobs,
}: {
    getJobs?: () => Promise<JobListItem[]>;
}) {
    const [jobs, setJobs] = useState<JobListItem[] | null>(null);

    useEffect(() => {
        getJobs().then((loadedJobs) => {
            setJobs(sortJobsByUpdatedAt(loadedJobs));
        });
    }, [getJobs]);

    if (!jobs) {
        return (
            <div>
                <h1>Jobs</h1>
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div>
            <h1>Jobs</h1>

            {jobs.length === 0 ? (
                <p>No jobs yet.</p>
            ) : (
                <ul>
                    {jobs.map((job) => (
                        <li key={job.id}>
                            <div>{job.company}</div>
                            <div>
                                <a href={`/jobs/${job.id}`}>{job.title}</a>
                            </div>
                            <div>{job.status}</div>
                            <div>{formatDate(job.updatedAt)}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
