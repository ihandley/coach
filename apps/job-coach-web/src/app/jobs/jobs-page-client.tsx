"use client";

import { useEffect, useState } from "react";
import {
    formatJobUpdatedDate,
    sortJobsByUpdatedDate,
    type JobListItem,
} from "./jobs-page-model";

async function defaultGetJobs(): Promise<JobListItem[]> {
    const res = await fetch("/api/jobs");
    if (!res.ok) return [];
    return res.json();
}

export function JobsPageClient({
    getJobs = defaultGetJobs,
}: {
    getJobs?: () => Promise<JobListItem[]>;
}) {
    const [jobs, setJobs] = useState<JobListItem[] | null>(null);

    useEffect(() => {
        getJobs().then((result) => setJobs(sortJobsByUpdatedDate(result)));
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
                            <div>{formatJobUpdatedDate(job.updatedAt)}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
