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

async function createJob(input: {
    sourceUrl?: string;
    sourceText?: string;
}) {
    const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
    });

    if (!res.ok) {
        throw new Error("Failed to create job");
    }

    return res.json();
}

export function JobsPageClient({
    getJobs = defaultGetJobs,
}: {
    getJobs?: () => Promise<JobListItem[]>;
}) {
    const [jobs, setJobs] = useState<JobListItem[] | null>(null);

    const [sourceUrl, setSourceUrl] = useState("");
    const [sourceText, setSourceText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function refresh() {
        const result = await getJobs();
        setJobs(sortJobsByUpdatedDate(result));
    }

    useEffect(() => {
        refresh();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (sourceUrl.trim()) {
                await createJob({ sourceUrl });
                setSourceUrl("");
            } else if (sourceText.trim()) {
                await createJob({ sourceText });
                setSourceText("");
            } else {
                throw new Error("Provide URL or text");
            }

            await refresh();
        } catch (err) {
            setError("Failed to create job");
        } finally {
            setLoading(false);
        }
    }

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

            <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
                <div>
                    <input
                        placeholder="Job URL"
                        value={sourceUrl}
                        onChange={(e) => setSourceUrl(e.target.value)}
                        style={{ width: "100%", marginBottom: 8 }}
                    />
                </div>

                <div>
                    <textarea
                        placeholder="Paste job description"
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                        style={{ width: "100%", height: 120 }}
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Add Job"}
                </button>

                {error && <p>{error}</p>}
            </form>

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
