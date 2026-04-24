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
    const [url, setUrl] = useState("");

    async function load() {
        const res = await fetch("/api/jobs/ranked");
        setJobs(await res.json());
    }

    async function handleImport() {
        if (!url) return;

        await fetch("/api/jobs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sourceUrl: url }),
        });

        await load();
        setUrl("");
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div>
            <h1>Ranked Jobs</h1>

            <div style={{ marginBottom: 16 }}>
                <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste job URL"
                    style={{ width: 300, marginRight: 8 }}
                />
                <button onClick={handleImport}>Import</button>
            </div>

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
