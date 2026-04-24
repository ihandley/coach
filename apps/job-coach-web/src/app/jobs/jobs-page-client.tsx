"use client";

import { useEffect, useState } from "react";
import { JobMatchButton } from "./job-match-button";
import { JobMatchView } from "./job-match-view";

type RankedJob = {
    id: string;
    title: string;
    company: string;
    score: number;
};

export function JobsPageClient() {
    const [jobs, setJobs] = useState<RankedJob[]>([]);

    async function load() {
        const res = await fetch("/api/jobs/ranked");
        setJobs(await res.json());
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div>
            <h1>Ranked Jobs</h1>

            <ul>
                {jobs.map((job) => (
                    <li key={job.id} style={{ marginBottom: 12 }}>
                        <div>
                            <strong>{job.title}</strong> — {job.company}
                        </div>

                        <div>Score: {job.score}</div>

                        <JobMatchButton jobId={job.id} resumeProfileId="default" />
                        <JobMatchView jobId={job.id} />
                    </li>
                ))}
            </ul>
        </div>
    );
}
